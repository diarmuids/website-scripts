// Last updated: 2026-07-30 14:37:17

(() => {
  const initDiepFlapCalculator = () => {
    const form = document.querySelector(".form_component.is-calculator form");

    if (!form || form.dataset.diepCalculatorReady === "true") {
      return;
    }

    const calculator = form.closest(".form_component.is-calculator");
    const inputs = Array.from(form.querySelectorAll("input.form_input")).slice(
      0,
      3,
    );
    const successPanel = calculator?.querySelector(".w-form-done");
    const errorPanel = calculator?.querySelector(".w-form-fail");
    const errorText = errorPanel?.querySelector(".error-text");

    if (inputs.length !== 3 || !successPanel || !errorPanel) {
      return;
    }

    form.dataset.diepCalculatorReady = "true";

    inputs.forEach((input) => {
      input.type = "number";
      input.inputMode = "decimal";
      input.min = "0";
      input.step = "any";
    });

    const showError = (message) => {
      successPanel.style.display = "none";
      if (errorText) {
        errorText.textContent = message;
      }
      errorPanel.style.display = "block";
    };

    form.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();

        const values = inputs.map((input) => Number.parseFloat(input.value));
        const invalidIndex = values.findIndex(
          (value) => !Number.isFinite(value) || value <= 0,
        );

        if (invalidIndex !== -1) {
          showError("Please enter a valid positive number in every field.");
          inputs[invalidIndex].focus();
          return;
        }

        const [x, y, z] = values;
        const estimatedWeight = 91.3 * x + 36.4 * y + 6.2 * z - 1030;

        if (estimatedWeight <= 0) {
          showError(
            "These measurements do not produce a positive estimated flap weight. Please check the values entered.",
          );
          return;
        }

        errorPanel.style.display = "none";
        successPanel.innerHTML = `
          <div class="form_success-inner is-sticky">
            <div class="text-rich-text w-richtext">
              <p><strong>Estimated DIEP Flap Weight</strong></p>
              <p><strong>${estimatedWeight.toFixed(2)} g</strong></p>
              <p>Calculated using the entered CT measurements and patient weight.</p>
            </div>
          </div>
        `;
        successPanel.style.display = "block";
      },
      true,
    );
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDiepFlapCalculator);
  } else {
    initDiepFlapCalculator();
  }
})();
