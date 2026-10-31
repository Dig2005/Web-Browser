import {
  Calculator,
  ExternalLink,
  NotebookText,
  Trash2,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useBrowser } from "../../context/BrowserContext";
import { quickTools } from "../../data/dashboardData";

const TOOL_URLS = {
  weather: "https://www.google.com/search?q=weather+Gurugram",

  translator: "https://translate.google.com/",

  calendar: "https://calendar.google.com/",

  maps: "https://maps.google.com/",

  "speed-test": "https://fast.com/",

  "travel-planner": "https://www.google.com/travel/",
};

function QuickTools({ styles }) {
  const { navigate } = useBrowser();

  const [activeDialog, setActiveDialog] = useState(null);

  const [firstNumber, setFirstNumber] = useState("");
  const [secondNumber, setSecondNumber] = useState("");
  const [result, setResult] = useState(null);

  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem("safora-quick-notes") ?? "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("safora-quick-notes", notes);
    } catch {
      return;
    }
  }, [notes]);

  const closeDialog = () => {
    setActiveDialog(null);
  };

  const handleToolClick = async (toolId) => {
    if (toolId === "calculator" || toolId === "notes") {
      setActiveDialog(toolId);
      return;
    }

    const destination = TOOL_URLS[toolId];

    if (!destination) {
      return;
    }

    await navigate(destination);
  };

  const calculate = (operator) => {
    const first = Number(firstNumber);
    const second = Number(secondNumber);

    if (
      firstNumber.trim() === "" ||
      secondNumber.trim() === "" ||
      !Number.isFinite(first) ||
      !Number.isFinite(second)
    ) {
      setResult("Enter valid numbers");
      return;
    }

    if (operator === "+") {
      setResult(first + second);
      return;
    }

    if (operator === "-") {
      setResult(first - second);
      return;
    }

    if (operator === "×") {
      setResult(first * second);
      return;
    }

    if (operator === "÷") {
      setResult(second === 0 ? "Cannot divide by zero" : first / second);
    }
  };

  return (
    <section
      id="quick-tools"
      className={`${styles.panel} ${styles.quickTools}`}
    >
      <header className={styles.panelHeader}>
        <div>
          <span className={styles.lightning}>⚡</span>
          <h2>Quick Tools</h2>
        </div>
      </header>

      <div className={styles.toolsGrid}>
        {quickTools.map((tool) => {
          const Icon = tool.icon;

          return (
            <button
              key={tool.id}
              type="button"
              className={styles.toolCard}
              onClick={() => handleToolClick(tool.id)}
              aria-label={`Open ${tool.label}`}
            >
              <span
                className={`${styles.toolIcon} ${styles[`tool${tool.color}`]}`}
              >
                <Icon size={25} />
              </span>

              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      {activeDialog === "calculator" && (
        <div className={styles.toolDialog}>
          <div className={styles.dialogHeader}>
            <div>
              <Calculator size={19} />
              <h3>Calculator</h3>
            </div>

            <button
              type="button"
              onClick={closeDialog}
              aria-label="Close calculator"
            >
              <X size={18} />
            </button>
          </div>

          <div className={styles.calculatorInputs}>
            <input
              type="number"
              value={firstNumber}
              onChange={(event) => setFirstNumber(event.target.value)}
              placeholder="First number"
            />

            <input
              type="number"
              value={secondNumber}
              onChange={(event) => setSecondNumber(event.target.value)}
              placeholder="Second number"
            />
          </div>

          <div className={styles.calculatorActions}>
            {["+", "-", "×", "÷"].map((operator) => (
              <button
                key={operator}
                type="button"
                onClick={() => calculate(operator)}
              >
                {operator}
              </button>
            ))}
          </div>

          <output className={styles.calculatorResult} aria-live="polite">
            {result === null ? "Result" : result}
          </output>
        </div>
      )}

      {activeDialog === "notes" && (
        <div className={styles.toolDialog}>
          <div className={styles.dialogHeader}>
            <div>
              <NotebookText size={19} />
              <h3>Quick Notes</h3>
            </div>

            <button
              type="button"
              onClick={closeDialog}
              aria-label="Close notes"
            >
              <X size={18} />
            </button>
          </div>

          <textarea
            className={styles.notesTextarea}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Write a quick note..."
            aria-label="Quick notes"
          />

          <div className={styles.notesActions}>
            <button type="button" onClick={() => setNotes("")}>
              <Trash2 size={15} />
              Clear
            </button>

            <button type="button" onClick={closeDialog}>
              <ExternalLink size={15} />
              Done
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default QuickTools;
