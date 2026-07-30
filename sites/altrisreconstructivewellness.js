// Last updated: 2026-07-30 15:45:18

(() => {
  const initDiepFlapCalculator = () => {
    const form = document.querySelector(".form_component.is-calculator form");

    if (!form || form.diepCalculatorInitialized) {
      return;
    }

    const inputs = Array.from(form.querySelectorAll("input.form_input")).slice(
      0,
      3,
    );
    const result = form.querySelector(".calc_value");
    const resultFooter = form.querySelector(".calc_value-footer");

    if (inputs.length !== 3 || !result) {
      return;
    }

    form.diepCalculatorInitialized = true;

    if (resultFooter) {
      resultFooter.style.opacity = "0";
      resultFooter.style.pointerEvents = "none";
      resultFooter.setAttribute("aria-hidden", "true");
    }

    inputs.forEach((input) => {
      input.type = "number";
      input.inputMode = "decimal";
      input.min = "0";
      input.step = "any";
    });

    const updateResult = () => {
      if (inputs.some((input) => input.value.trim() === "")) {
        result.textContent = "0.00g";
        return;
      }

      const values = inputs.map((input) => Number.parseFloat(input.value));

      if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
        result.textContent = "0.00g";
        return;
      }

      const [x, y, z] = values;
      const estimatedWeight = 91.3 * x + 36.4 * y + 6.2 * z - 1030;

      result.textContent =
        estimatedWeight > 0
          ? `${estimatedWeight.toFixed(2)}g`
          : "0.00g";
    };

    inputs.forEach((input) => input.addEventListener("input", updateResult));
    form.addEventListener("submit", (event) => event.preventDefault());
    updateResult();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDiepFlapCalculator);
  } else {
    initDiepFlapCalculator();
  }
})();
