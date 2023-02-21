import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { TextModel, TextFeatureExtractionModel } from "@visheratin/web-ai";

export interface ElementOutput {
  id: string;
  text: string;
  similarity: number;
}

const Sandbox = () => {
  useEffect(() => {
    loadModel();
  }, []);

  const processSearch = async (
    m: TextFeatureExtractionModel,
    message: string,
    elements: ElementText[]
  ) => {
    if (!elements) {
      return;
    }
    window.parent.postMessage(
      { command: "status", message: "searching", busy: true },
      "*"
    );
    const mRes = await m.process(message);
    let result = [] as ElementOutput[];
    for (let i = 0; i < elements.length; i++) {
      if (!elements[i] || !elements[i].text) {
        continue;
      }
      const eRes = await m.process(elements[i].text);
      const sim = cosineSim(mRes.result, eRes.result);
      const elem = {
        id: elements[i].id,
        text: elements[i].text,
        similarity: sim,
      };
      if (sim > 0.6) {
        result.push(elem);
        result.sort((a, b) => b.similarity - a.similarity);
        window.parent.postMessage(
          {
            command: "result",
            value: result,
          },
          "*"
        );
      }
    }

    window.parent.postMessage(
      { command: "status", message: "ready", busy: false },
      "*"
    );
  };

  const loadModel = async () => {
    window.parent.postMessage(
      { command: "status", message: "loading the model", busy: true },
      "*"
    );
    const result = await TextModel.create("gtr-t5-quant", 500, false);
    const m = result.model as TextFeatureExtractionModel;
    window.parent.postMessage(
      { command: "status", message: "ready", busy: false },
      "*"
    );
    window.addEventListener("message", function (event) {
      if (event.data.command !== "search") return;
      processSearch(m, event.data.value, event.data.elements);
    });
  };

  const cosineSim = (vector1: number[], vector2: number[]) => {
    let dotproduct = 0;
    let m1 = 0;
    let m2 = 0;
    for (let i = 0; i < vector1.length; i++) {
      dotproduct += vector1[i] * vector2[i];
      m1 += vector1[i] * vector1[i];
      m2 += vector2[i] * vector2[i];
    }
    m1 = Math.sqrt(m1);
    m2 = Math.sqrt(m2);
    const sim = dotproduct / (m1 * m2);
    return sim;
  };

  return <></>;
};

ReactDOM.render(
  <React.StrictMode>
    <Sandbox />
  </React.StrictMode>,
  document.getElementById("root")
);
