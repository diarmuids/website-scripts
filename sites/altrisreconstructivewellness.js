// Last updated: 2026-07-30 15:41:43

// // Last updated: 2026-07-30 15:38:27

// (() => {
//   const initDiepFlapCalculator = () => {
//     const form = document.querySelector(".form_component.is-calculator form");

//     if (!form || form.diepCalculatorInitialized) {
//       return;
//     }

//     const inputs = Array.from(form.querySelectorAll("input.form_input")).slice(
//       0,
//       3,
//     );
//     const result = form.querySelector(".calc_value");

//     if (inputs.length !== 3 || !result) {
//       return;
//     }

//     form.diepCalculatorInitialized = true;

//     inputs.forEach((input) => {
//       input.type = "number";
//       input.inputMode = "decimal";
//       input.min = "0";
//       input.step = "any";
//     });

//     const updateResult = () => {
//       if (inputs.some((input) => input.value.trim() === "")) {
//         result.textContent = "Please enter values above";
//         return;
//       }

//       const values = inputs.map((input) => Number.parseFloat(input.value));

//       if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
//         result.textContent = "Please enter valid positive values above";
//         return;
//       }

//       const [x, y, z] = values;
//       const estimatedWeight = 91.3 * x + 36.4 * y + 6.2 * z - 1030;

//       result.textContent =
//         estimatedWeight > 0
//           ? `${estimatedWeight.toFixed(2)} g`
//           : "Please check the values above";
//     };

//     inputs.forEach((input) => input.addEventListener("input", updateResult));
//     form.addEventListener("submit", (event) => event.preventDefault());
//     updateResult();
//   };

//   if (document.readyState === "loading") {
//     document.addEventListener("DOMContentLoaded", initDiepFlapCalculator);
//   } else {
//     initDiepFlapCalculator();
//   }
// })();
