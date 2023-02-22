import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { TextModel, TextFeatureExtractionModel } from "@visheratin/web-ai";
import md5 from "md5";

export interface ElementOutput {
  id: string;
  hash: string;
  text: string;
  similarity: number;
}

const Sandbox = () => {
  let cache = {} as { [key: string]: number[] };

  useEffect(() => {
    loadModel();
    loadFromStorage();
  }, []);

  const loadFromStorage = async () => {
    const dataItems = await chrome.storage.local.get("cache");
    const rawData = dataItems["cache"];
    if (rawData) {
      cache = JSON.parse(rawData);
    }
  };

  const saveToStorage = async () => {
    await chrome.storage.local.set({ cache: JSON.stringify(cache) });
  };

  const splitText = (text: string, length: number) => {
    const textParts = text.replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|");
    let result = [] as string[];
    let current = "";
    for (let i = 0; i < textParts.length; i++) {
      current += " ";
      current += textParts[i];
      if (current.length > length) {
        result.push(current.trim());
        current = "";
      }
    }
    if (current.length > 0) {
      result.push(current);
    }
    return result;
  };

  const splitElements = (elements: ElementText[]) => {
    let result = [] as ElementText[];
    for (let i = 0; i < elements.length; i++) {
      if (!elements[i] || !elements[i].text) {
        continue;
      }
      const textParts = splitText(elements[i].text, 280);
      for (let j = 0; j < textParts.length; j++) {
        result.push({ id: elements[i].id, text: textParts[j] });
      }
    }
    return result;
  };

  const processSearch = async (
    m: TextFeatureExtractionModel,
    message: string,
    elements: ElementText[]
  ) => {
    if (!elements || elements.length === 0) {
      return;
    }
    window.parent.postMessage(
      { command: "status", message: "searching", busy: true, progress: 0.0 },
      "*"
    );
    const searchElements = splitElements(elements);
    const messageOutput = await m.process(message);
    let result = [] as ElementOutput[];
    for (let i = 0; i < searchElements.length; i++) {
      let sim = 0;
      const text = searchElements[i].text;
      const hash = md5(text);
      if (cache[hash]) {
        sim = cosineSim(messageOutput.result, cache[hash]);
      } else {
        const eRes = await m.process(text);
        cache[hash] = eRes.result;
        sim = cosineSim(messageOutput.result, eRes.result);
        saveToStorage();
      }
      sim = Math.round(sim * 100) / 100;
      const elem = {
        id: searchElements[i].id,
        hash: hash,
        text: text,
        similarity: sim,
      };
      if (sim > 0.6) {
        result.push(elem);
        result.sort((a, b) => b.similarity - a.similarity);
        result = result.slice(0, 7);
        window.parent.postMessage(
          {
            command: "result",
            value: result,
          },
          "*"
        );
      }
      if (i % 10 === 0) {
        window.parent.postMessage(
          {
            command: "status",
            message: "searching",
            busy: true,
            progress: Math.round((i / searchElements.length) * 100.0),
          },
          "*"
        );
      }
    }

    window.parent.postMessage(
      { command: "status", message: "finished", busy: false, progress: 100.0 },
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
