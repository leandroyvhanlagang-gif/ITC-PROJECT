
"use strict";

// Reusable formatters keep displayed numbers consistent.
const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const numberFormatter = new Intl.NumberFormat("en-PH", {
  maximumFractionDigits: 6
});

const formatPeso = (amount) => pesoFormatter.format(amount);
const formatNumber = (number) => numberFormatter.format(number);

// ---------- Navigation ----------
const navButtons = document.querySelectorAll(".nav-link");
const views = document.querySelectorAll(".view");
const currentPage = document.getElementById("currentPage");
const sidebar = document.getElementById("sidebar");
const mobileMenu = document.getElementById("mobileMenu");

const openView = (viewName) => {
  views.forEach((view) => {
    view.classList.toggle("active", view.id === viewName);
  });

  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  const activeButton = [...navButtons].find((button) => button.dataset.view === viewName);
  currentPage.textContent = activeButton ? activeButton.textContent.trim().replace(/^\S+\s*/, "") : "Overview";
  navButtons.forEach((button) => {
    if (button.dataset.view === viewName) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  sidebar.classList.remove("open");
  mobileMenu.setAttribute("aria-expanded", "false");
};

navButtons.forEach((button) => {
  button.addEventListener("click", () => openView(button.dataset.view));
});

document.querySelectorAll("[data-go]").forEach((card) => {
  card.addEventListener("click", () => openView(card.dataset.go));
});

mobileMenu.addEventListener("click", () => {
  const isOpen = sidebar.classList.toggle("open");
  mobileMenu.setAttribute("aria-expanded", String(isOpen));
});

// ---------- Conversion calculator ----------
const conversionUnits = {
  length: {
    m: { label: "Meter (m)", factor: 1 },
    km: { label: "Kilometer (km)", factor: 1000 },
    cm: { label: "Centimeter (cm)", factor: 0.01 },
    mm: { label: "Millimeter (mm)", factor: 0.001 },
    mi: { label: "Mile (mi)", factor: 1609.344 },
    ft: { label: "Foot (ft)", factor: 0.3048 },
    in: { label: "Inch (in)", factor: 0.0254 }
  },
  weight: {
    kg: { label: "Kilogram (kg)", factor: 1 },
    g: { label: "Gram (g)", factor: 0.001 },
    mg: { label: "Milligram (mg)", factor: 0.000001 },
    lb: { label: "Pound (lb)", factor: 0.45359237 },
    oz: { label: "Ounce (oz)", factor: 0.028349523125 }
  },
  temperature: {
    C: { label: "Celsius (°C)" },
    F: { label: "Fahrenheit (°F)" },
    K: { label: "Kelvin (K)" }
  }
};

const conversionType = document.getElementById("conversionType");
const conversionFrom = document.getElementById("conversionFrom");
const conversionTo = document.getElementById("conversionTo");
const conversionValue = document.getElementById("conversionValue");
const conversionResult = document.getElementById("conversionResult");

const populateUnitOptions = () => {
  const units = conversionUnits[conversionType.value];
  const optionsHTML = Object.entries(units)
    .map(([unitCode, unitInfo]) => `<option value="${unitCode}">${unitInfo.label}</option>`)
    .join("");

  conversionFrom.innerHTML = optionsHTML;
  conversionTo.innerHTML = optionsHTML;

  // Choose different defaults to make the conversion direction obvious.
  conversionFrom.selectedIndex = 0;
  conversionTo.selectedIndex = Math.min(1, conversionTo.options.length - 1);
};

const convertTemperature = (value, fromUnit, toUnit) => {
  let celsius;

  if (fromUnit === "C") celsius = value;
  if (fromUnit === "F") celsius = (value - 32) * (5 / 9);
  if (fromUnit === "K") celsius = value - 273.15;

  if (toUnit === "C") return celsius;
  if (toUnit === "F") return (celsius * (9 / 5)) + 32;
  return celsius + 273.15;
};

const convertUnits = (value, category, fromUnit, toUnit) => {
  if (category === "temperature") {
    return convertTemperature(value, fromUnit, toUnit);
  }

  const units = conversionUnits[category];
  const valueInBaseUnit = value * units[fromUnit].factor;
  return valueInBaseUnit / units[toUnit].factor;
};

const showConversionError = (message) => {
  conversionResult.innerHTML = `
    <span class="result-label">INPUT ERROR</span>
    <strong class="result-placeholder">${message}</strong>
    <p>Please correct the input and try again.</p>
  `;
};

document.getElementById("convertButton").addEventListener("click", () => {
  const rawValue = conversionValue.value;
  const value = Number(rawValue);

  if (rawValue.trim() === "" || !Number.isFinite(value)) {
    showConversionError("Enter a valid number.");
    return;
  }

  if (conversionType.value === "temperature") {
    const minimumByUnit = { C: -273.15, F: -459.67, K: 0 };
    if (value < minimumByUnit[conversionFrom.value]) {
      showConversionError("Temperature cannot be below absolute zero.");
      return;
    }
  }

  const result = convertUnits(value, conversionType.value, conversionFrom.value, conversionTo.value);
  if (!Number.isFinite(result) || (conversionType.value === "temperature" && conversionTo.value === "K" && result < -1e-10)) {
    showConversionError("That conversion is outside the valid range.");
    return;
  }

  const cleanResult = Math.abs(result) < 1e-10 ? 0 : result;
  conversionResult.innerHTML = `
    <span class="result-label">CONVERSION RESULT</span>
    <strong>${formatNumber(cleanResult)} ${conversionTo.value}</strong>
    <p>${formatNumber(value)} ${conversionFrom.value} = ${formatNumber(cleanResult)} ${conversionTo.value}</p>
  `;
});

conversionType.addEventListener("change", populateUnitOptions);

document.getElementById("clearConversion").addEventListener("click", () => {
  conversionValue.value = "";
  populateUnitOptions();
  conversionResult.innerHTML = `
    <span class="result-label">CONVERSION RESULT</span>
    <strong class="result-placeholder">Your result will appear here</strong>
    <p>Enter a value and select the units to begin.</p>
  `;
});

populateUnitOptions();

// ---------- Philippine income tax calculator ----------
// Bracket values below intentionally match the assignment's supplied table.
const taxBrackets = [
  { upperLimit: 250000, baseTax: 0, rate: 0, label: "₱0 – ₱250,000 (0%)" },
  { upperLimit: 400000, baseTax: 0, rate: 0.20, threshold: 250000, label: "Over ₱250,000 – ₱400,000 (20% of excess)" },
  { upperLimit: 800000, baseTax: 30000, rate: 0.25, threshold: 400000, label: "Over ₱400,000 – ₱800,000 (₱30,000 + 25%)" },
  { upperLimit: 2000000, baseTax: 130000, rate: 0.30, threshold: 800000, label: "Over ₱800,000 – ₱2,000,000 (₱130,000 + 30%)" },
  { upperLimit: 8000000, baseTax: 490000, rate: 0.32, threshold: 2000000, label: "Over ₱2,000,000 – ₱8,000,000 (₱490,000 + 32%)" },
  { upperLimit: Infinity, baseTax: 2410000, rate: 0.35, threshold: 8000000, label: "Over ₱8,000,000 (₱2,410,000 + 35%)" }
];

const calculateIncomeTax = (income) => {
  const bracket = taxBrackets.find((item) => income <= item.upperLimit);
  if (income <= 250000) return { tax: 0, bracket };
  const tax = bracket.baseTax + ((income - bracket.threshold) * bracket.rate);
  return { tax, bracket };
};

const taxFeedback = document.getElementById("taxFeedback");

document.getElementById("calculateTax").addEventListener("click", () => {
  const input = document.getElementById("taxableIncome");
  const rawIncome = input.value;
  const income = Number(rawIncome);

  if (rawIncome.trim() === "" || !Number.isFinite(income)) {
    taxFeedback.textContent = "Please enter a valid taxable income.";
    taxFeedback.className = "feedback";
    return;
  }

  if (income < 0) {
    taxFeedback.textContent = "Taxable income cannot be negative.";
    taxFeedback.className = "feedback";
    return;
  }

  const { tax, bracket } = calculateIncomeTax(income);
  document.getElementById("taxAmount").textContent = formatPeso(tax);
  document.getElementById("taxIncomeDisplay").textContent = formatPeso(income);
  document.getElementById("taxBracketDisplay").textContent = bracket.label;
  taxFeedback.textContent = "Tax calculated successfully.";
  taxFeedback.className = "feedback success";
});

// ---------- Looping exercises ----------
// Factorial: MUST use a while loop. BigInt keeps large factorials exact.
document.getElementById("factorialButton").addEventListener("click", () => {
  const input = document.getElementById("factorialInput");
  const resultBox = document.getElementById("factorialResult");
  const rawValue = input.value;
  const n = Number(rawValue);

  if (rawValue.trim() === "" || !Number.isInteger(n) || n < 0 || n > 1000) {
    resultBox.textContent = "Enter a whole number from 0 to 1000.";
    return;
  }

  let factorial = 1n;
  let counter = 1;
  while (counter <= n) {
    factorial *= BigInt(counter);
    counter++;
  }

  resultBox.textContent = `${n}! = ${factorial.toString()}`;
});

// Sum: MUST use a do-while loop.
document.getElementById("sumButton").addEventListener("click", () => {
  const input = document.getElementById("sumInput");
  const resultBox = document.getElementById("sumResult");
  const rawValue = input.value;
  const n = Number(rawValue);

  if (rawValue.trim() === "" || !Number.isInteger(n) || n < 1 || n > 100000) {
    resultBox.textContent = "Enter a whole number from 1 to 100,000.";
    return;
  }

  let sum = 0;
  let counter = 1;
  do {
    sum += counter;
    counter++;
  } while (counter <= n);

  resultBox.textContent = `Sum from 1 to ${n} = ${formatNumber(sum)}`;
});

// Average: MUST use a for loop.
document.getElementById("averageButton").addEventListener("click", () => {
  const input = document.getElementById("averageInput");
  const resultBox = document.getElementById("averageResult");
  const rawValue = input.value;
  const n = Number(rawValue);

  if (rawValue.trim() === "" || !Number.isInteger(n) || n < 1 || n > 100000) {
    resultBox.textContent = "Enter a whole number from 1 to 100,000.";
    return;
  }

  let sum = 0;
  for (let counter = 1; counter <= n; counter++) {
    sum += counter;
  }

  const average = sum / n;
  resultBox.textContent = `Average from 1 to ${n} = ${formatNumber(average)}`;
});

// ---------- Payroll management system ----------
const employees = []; // Each employee record is stored as an object in this array.
const employeeForm = document.getElementById("employeeForm");
const payrollFeedback = document.getElementById("payrollFeedback");

const renderPayroll = () => {
  const tableBody = document.getElementById("payrollTableBody");
  const employeeCount = document.getElementById("employeeCount");

  if (employees.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No employees in the payroll list yet. Add an employee above to get started.</td></tr>';
  } else {
    tableBody.innerHTML = employees.map((employee, index) => {
      const { name, daysWorked, dailyRate, grossPay, deduction, netPay } = employee;
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHTML(name)}</td>
          <td>${formatNumber(daysWorked)}</td>
          <td>${formatPeso(dailyRate)}</td>
          <td>${formatPeso(grossPay)}</td>
          <td>${formatPeso(deduction)}</td>
          <td><strong>${formatPeso(netPay)}</strong></td>
        </tr>
      `;
    }).join("");
  }

  const totals = employees.reduce((summary, employee) => ({
    gross: summary.gross + employee.grossPay,
    deductions: summary.deductions + employee.deduction,
    net: summary.net + employee.netPay
  }), { gross: 0, deductions: 0, net: 0 });

  document.getElementById("totalGross").textContent = formatPeso(totals.gross);
  document.getElementById("totalDeductions").textContent = formatPeso(totals.deductions);
  document.getElementById("totalNet").textContent = formatPeso(totals.net);
  employeeCount.textContent = `${employees.length} ${employees.length === 1 ? "employee" : "employees"} recorded`;
};

// Escape user-entered text before placing it inside table HTML.
const escapeHTML = (text) => {
  const safeCharacters = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, (character) => safeCharacters[character]);
};

employeeForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("employeeName").value.trim();
  const daysWorked = Number(document.getElementById("daysWorked").value);
  const dailyRate = Number(document.getElementById("dailyRate").value);
  const deduction = Number(document.getElementById("deductionAmount").value);

  if (!name || ![daysWorked, dailyRate, deduction].every(Number.isFinite)) {
    payrollFeedback.textContent = "Please complete all employee fields with valid values.";
    payrollFeedback.className = "feedback";
    return;
  }

  if (daysWorked < 0 || dailyRate < 0 || deduction < 0) {
    payrollFeedback.textContent = "Days worked, daily rate, and deductions cannot be negative.";
    payrollFeedback.className = "feedback";
    return;
  }

  const grossPay = daysWorked * dailyRate;
  if (deduction > grossPay) {
    payrollFeedback.textContent = "Deduction cannot be greater than the employee's gross pay.";
    payrollFeedback.className = "feedback";
    return;
  }

  const netPay = grossPay - deduction;
  employees.push({ name, daysWorked, dailyRate, grossPay, deduction, netPay });
  renderPayroll();
  employeeForm.reset();
  payrollFeedback.textContent = `${name} was added to the payroll list.`;
  payrollFeedback.className = "feedback success";
});

document.getElementById("deleteEmployee").addEventListener("click", () => {
  const lineInput = document.getElementById("deleteLineNumber");
  const lineNumber = Number(lineInput.value);

  if (lineInput.value.trim() === "" || !Number.isInteger(lineNumber) || lineNumber < 1) {
    payrollFeedback.textContent = "Enter a valid payroll line number to delete.";
    payrollFeedback.className = "feedback";
    return;
  }

  if (lineNumber > employees.length) {
    payrollFeedback.textContent = `Line ${lineNumber} does not exist in the payroll list.`;
    payrollFeedback.className = "feedback";
    return;
  }

  const [deletedEmployee] = employees.splice(lineNumber - 1, 1);
  renderPayroll();
  lineInput.value = "";
  payrollFeedback.textContent = `${deletedEmployee.name} was deleted. Payroll totals and numbering were updated.`;
  payrollFeedback.className = "feedback success";
});

// Initial state: show the empty payroll message and zero totals.
renderPayroll();

// The wordmark also returns to the overview.
document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  openView("overview");
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    sidebar.classList.remove("open");
    mobileMenu.setAttribute("aria-expanded", "false");
  }
});
openView("overview");
