// Last updated: 2026-08-21 11:05:00

(() => {
  const CALCULATORS = {
    diep: {
      resultHeading: "DIEP Flap Weight",
      fields: [
        {
          label: "(X)  Subcutaneous tissue thickness",
          helper: "Enter measurement X in centimetres.",
          placeholder: "Enter thickness in cm",
          unit: "cm",
        },
        {
          label: "(Y)  Estimated skin paddle length",
          helper: "Enter measurement Y in centimetres.",
          placeholder: "Enter length in cm",
          unit: "cm",
        },
        {
          label: "(Z)  Patient weight",
          helper: "Enter patient’s pre-operative weight in kg.",
          placeholder: "Enter weight in kg",
          unit: "kg",
        },
      ],
      calculate: ([x, y, z]) => 91.3 * x + 36.4 * y + 6.2 * z - 1030,
    },
    pap: {
      resultHeading: "PAP Flap Weight",
      fields: [
        {
          label: "(X)  Subcutaneous tissue thickness",
          helper: "Enter measurement X in centimetres.",
          placeholder: "Enter thickness in cm",
          unit: "cm",
        },
        {
          label: "(Y)  Inferior gluteal fold to dominant PAP",
          helper: "Enter measurement Y in centimetres.",
          placeholder: "Enter distance in cm",
          unit: "cm",
        },
        {
          label: "(Z)  Patient scan position",
          helper: "Select the patient’s position during the CT scan.",
          type: "select",
          placeholder: "Select scan position",
          options: [
            { label: "Supine", value: "1" },
            { label: "Prone", value: "0" },
          ],
        },
      ],
      calculate: ([x, y, z]) => 77.9 * x + 33.8 * y + 43.4 * z - 254.3,
    },
  };

  const initFlapCalculator = () => {
    const form = document.querySelector(".form_component.is-calculator form");
    const tabs = document.querySelector(".podcast_row.is-calculator .w-tabs");

    if (!form || !tabs || form.flapCalculatorInitialized) {
      return;
    }

    const fieldWrappers = Array.from(
      form.querySelectorAll(".form_field-wrapper.is-calc"),
    ).slice(0, 3);
    const resultHeading = form.querySelector(".calc_value-header");
    const result = form.querySelector(".calc_value");
    const resultFooter = form.querySelector(".calc_value-footer");

    if (
      fieldWrappers.length !== 3 ||
      !resultHeading ||
      !result ||
      !resultFooter
    ) {
      return;
    }

    form.flapCalculatorInitialized = true;

    if (!document.querySelector("#flap-calculator-number-styles")) {
      const numberStyles = document.createElement("style");
      numberStyles.id = "flap-calculator-number-styles";
      numberStyles.textContent = `
        .form_component.is-calculator input.form_input[type="number"] {
          appearance: textfield;
          -moz-appearance: textfield;
        }

        .form_component.is-calculator input.form_input[type="number"]::-webkit-inner-spin-button,
        .form_component.is-calculator input.form_input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .form_component.is-calculator .calc_unit {
          pointer-events: none;
        }

        .form_component.is-calculator select.form_input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2.5 4.25 6 7.75l3.5-3.5' stroke='%231a1a1a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-position: right 16px center;
          background-repeat: no-repeat;
          background-size: 12px 12px;
          padding-right: 40px;
        }

        .form_component.is-calculator .calc_clear-values {
          appearance: none;
          background: none;
          border: 0;
          color: inherit;
          cursor: pointer;
          font: inherit;
          padding: 0;
          text-decoration: underline;
        }
      `;
      document.head.append(numberStyles);
    }

    const savedValues = {
      diep: ["", "", ""],
      pap: ["", "", ""],
    };
    let activeCalculator = "diep";

    const getCalculatorFromTab = (tab) =>
      /\bpap\b/i.test(tab?.getAttribute("data-w-tab") ?? "") ? "pap" : "diep";

    const getControls = () =>
      fieldWrappers.map((wrapper) =>
        wrapper.querySelector(".form_input-wrapper-calc .form_input"),
      );

    const saveCurrentValues = () => {
      savedValues[activeCalculator] = getControls().map(
        (control) => control?.value ?? "",
      );
    };

    const showCalculatedFooter = () => {
      const clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "calc_clear-values";
      clearButton.textContent = "Clear values";
      clearButton.addEventListener("click", () => {
        const controls = getControls();
        savedValues[activeCalculator] = ["", "", ""];

        controls.forEach((control) => {
          control.value = "";
        });
        controls.forEach((control) => {
          const eventName = control instanceof HTMLSelectElement
            ? "change"
            : "input";
          control.dispatchEvent(new Event(eventName, { bubbles: true }));
        });
      });

      resultFooter.replaceChildren(clearButton);
    };

    const updateResult = () => {
      const rawValues = getControls().map(
        (control) => control?.value.trim() ?? "",
      );

      if (rawValues.some((value) => value === "")) {
        result.textContent = "0.00g";
        resultFooter.textContent = "Auto-calculated once values are entered";
        return;
      }

      const values = rawValues.map((value) => Number.parseFloat(value));
      const invalid = values.some(
        (value, index) =>
          !Number.isFinite(value) ||
          value < 0 ||
          (index < 2 && value === 0) ||
          (activeCalculator === "diep" && index === 2 && value === 0),
      );

      if (invalid) {
        result.textContent = "0.00g";
        resultFooter.textContent = "Auto-calculated once values are entered";
        return;
      }

      const estimatedWeight =
        CALCULATORS[activeCalculator].calculate(values);

      result.textContent =
        estimatedWeight > 0 ? `${estimatedWeight.toFixed(2)}g` : "0.00g";
      if (estimatedWeight > 0) {
        showCalculatedFooter();
      } else {
        resultFooter.textContent = "Auto-calculated once values are entered";
      }
    };

    const createControl = (field, index, savedValue) => {
      const id = `flap-calculator-${activeCalculator}-${index + 1}`;

      if (field.type === "select") {
        const select = document.createElement("select");
        select.className = "form_input w-input";
        select.id = id;
        select.name = `${activeCalculator}-${index + 1}`;
        select.required = true;

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = field.placeholder;
        placeholder.disabled = true;
        select.append(placeholder);

        field.options.forEach((optionConfig) => {
          const option = document.createElement("option");
          option.value = optionConfig.value;
          option.textContent = optionConfig.label;
          select.append(option);
        });

        select.value = savedValue;
        select.addEventListener("change", updateResult);
        return select;
      }

      const input = document.createElement("input");
      input.className = "form_input w-input";
      input.id = id;
      input.name = `${activeCalculator}-${index + 1}`;
      input.type = "number";
      input.inputMode = "decimal";
      input.min = "0";
      input.step = "any";
      input.required = true;
      input.placeholder = field.placeholder;
      input.value = savedValue;
      input.addEventListener("input", updateResult);
      return input;
    };

    const renderCalculator = (calculatorName, saveValues = true) => {
      if (!CALCULATORS[calculatorName]) {
        return;
      }

      if (saveValues) {
        saveCurrentValues();
      }

      activeCalculator = calculatorName;
      const config = CALCULATORS[calculatorName];

      fieldWrappers.forEach((wrapper, index) => {
        const field = config.fields[index];
        const label = wrapper.querySelector(".form_label.is-calc");
        const helper = wrapper.querySelector(".calc_subtext");
        const controlWrapper = wrapper.querySelector(
          ".form_input-wrapper-calc",
        );

        if (!label || !helper || !controlWrapper) {
          return;
        }

        const oldControl = controlWrapper.querySelector(".form_input");
        let unit = controlWrapper.querySelector(".calc_unit");

        if (!unit) {
          unit = document.createElement("div");
          unit.className = "calc_unit";
          controlWrapper.append(unit);
        }

        const control = createControl(
          field,
          index,
          savedValues[calculatorName][index],
        );

        label.textContent = field.label;
        label.htmlFor = control.id;
        helper.textContent = field.helper;

        if (oldControl) {
          oldControl.replaceWith(control);
        } else {
          controlWrapper.prepend(control);
        }

        if (field.unit) {
          unit.textContent = field.unit;
          const updateUnitVisibility = () => {
            unit.style.visibility =
              control.value.trim() === "" ? "hidden" : "";
          };
          control.addEventListener("input", updateUnitVisibility);
          updateUnitVisibility();
        } else {
          unit.textContent = "kg";
          unit.style.visibility = "hidden";
        }
      });

      resultHeading.textContent = config.resultHeading;
      updateResult();
    };

    tabs.querySelectorAll(".calc_tab[data-w-tab]").forEach((tab) => {
      tab.addEventListener("click", () => {
        renderCalculator(getCalculatorFromTab(tab));
      });
    });

    form.addEventListener("submit", (event) => event.preventDefault());

    const initialCalculator = getCalculatorFromTab(
      tabs.querySelector(".calc_tab.w--current"),
    );
    renderCalculator(initialCalculator, false);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFlapCalculator);
  } else {
    initFlapCalculator();
  }
})();
