import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { ElementOutput } from "./sandbox";

const Popup = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [elements, setElements] = useState([] as ElementText[]);
  const [status, setStatus] = useState({
    message: "starting",
    busy: true,
    progress: 0.0,
  });
  const [results, setResults] = useState([] as ElementOutput[]);

  useEffect(() => {
    getElements();
    window.addEventListener("message", function (event) {
      if (event.data.command === "status") {
        setStatus({
          message: event.data.message,
          busy: event.data.busy,
          progress: event.data.progress,
        });
      }
      if (event.data.command === "result") {
        setResults(event.data.value);
      }
    });
  }, []);

  const getElements = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tab = tabs[0];
      if (tab.id) {
        chrome.tabs.sendMessage(
          tab.id,
          {
            command: "getElements",
          },
          (elements) => {
            setElements(elements);
          }
        );
      }
    });
  };

  const focusElement = (id: string) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tab = tabs[0];
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          command: "focusElement",
          value: id,
        });
      }
    });
  };

  const search = () => {
    setResults([]);
    const iframe = document.getElementById("searchFrame") as HTMLIFrameElement;
    const win = iframe.contentWindow;
    const msg = {
      command: "search",
      value: inputRef.current?.value,
      elements: elements,
    };
    win?.postMessage(msg, "*");
  };

  return (
    <>
      <div style={{ minWidth: "700px" }}>
        <div>
          <strong>Status: {status.message}</strong>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <input ref={inputRef} type="text" name="search" />
          <button onClick={search}>Search</button>
        </form>
      </div>
      <div>{status.progress}% ready</div>
      <div>
        {results.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Text</th>
                <th>Similarity</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item, _) => {
                return (
                  <tr
                    onClick={() => {
                      focusElement(item.id);
                    }}
                    key={item.hash}
                  >
                    <td>{item.text}</td>
                    <td>{item.similarity}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <iframe
        id="searchFrame"
        hidden={true}
        name="searchFrame"
        src="/sandbox.html"
      ></iframe>
    </>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById("root")
);
