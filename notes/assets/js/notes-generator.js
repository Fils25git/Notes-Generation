(() => {
  "use strict";

  const CONFIG = {
    primary: {
      label: "Primary Subjects Notes",
      classes: ["P1", "P2", "P3", "P4", "P5", "P6"],
      subjects: [
        { value: "eng", label: "English" },
        { value: "math", label: "Mathematics" },
        { value: "kiny", label: "Kinyarwanda" },
        { value: "set", label: "SET" },
        { value: "srs", label: "SRS" }
      ]
    },
    ordinary: {
      label: "Ordinary Level Subjects Notes",
      classes: ["S1", "S2", "S3"],
      subjects: [
        { value: "eng", label: "English" },
        { value: "math", label: "Mathematics" },
        { value: "kiny", label: "Kinyarwanda" },
        { value: "chemistry", label: "Chemistry" },
        { value: "biology", label: "Biology" },
        { value: "history", label: "History" },
        { value: "geography", label: "Geography" },
        { value: "entrepreneurship", label: "Entrepreneurship" },
        { value: "physics", label: "Physics" }
      ]
    }
  };

  const MAX_VERSIONS = 5;

  const state = {
    category: null,
    generatedBlob: null,
    previewUrl: null,
    selectedVersion: null,
    lastFormData: null
  };

  const elements = {
    modal: document.getElementById("categoryModal"),
    categoryOptions: document.querySelectorAll(".category-option"),
    categoryBadge: document.getElementById("selectedCategoryBadge"),
    changeCategoryBtn: document.getElementById("changeCategoryBtn"),
    form: document.getElementById("notesForm"),
    teacherName: document.getElementById("teacherName"),
    schoolName: document.getElementById("schoolName"),
    academicYear: document.getElementById("academicYear"),
    district: document.getElementById("district"),
    sector: document.getElementById("sector"),
    classLevel: document.getElementById("classLevel"),
    subject: document.getElementById("subject"),
    getNotesBtn: document.getElementById("getNotesBtn"),
    formMessage: document.getElementById("formMessage"),
    resultPanel: document.getElementById("resultPanel"),
    pdfPreview: document.getElementById("pdfPreview"),
    fileName: document.getElementById("fileName"),
    downloadBtn: document.getElementById("downloadBtn"),
    generateAnotherBtn: document.getElementById("generateAnotherBtn"),
    versionBadge: document.getElementById("versionBadge")
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    populateAcademicYears();
    restoreSavedTeacher();
    bindEvents();
  }

  function bindEvents() {
    elements.categoryOptions.forEach((button) => {
      button.addEventListener("click", () => selectCategory(button.dataset.category));
    });

    elements.changeCategoryBtn.addEventListener("click", openCategoryModal);
    elements.form.addEventListener("submit", handleGenerate);
    elements.downloadBtn.addEventListener("click", downloadGeneratedNotes);
    elements.generateAnotherBtn.addEventListener("click", handleGenerate);

    elements.form.querySelectorAll("input, select").forEach((field) => {
      field.addEventListener("input", () => field.classList.remove("invalid"));
      field.addEventListener("change", () => field.classList.remove("invalid"));
    });

    window.addEventListener("beforeunload", cleanupPreviewUrl);
  }

  function populateAcademicYears() {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 1; year <= currentYear + 3; year += 1) {
      const option = document.createElement("option");
      option.value = `${year}-${year + 1}`;
      option.textContent = `${year}-${year + 1}`;
      if (year === currentYear) option.selected = true;
      elements.academicYear.appendChild(option);
    }
  }

  function restoreSavedTeacher() {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user?.full_name) elements.teacherName.value = user.full_name;
      if (user?.school_name) elements.schoolName.value = user.school_name;
      if (user?.district) elements.district.value = user.district;
      if (user?.sector) elements.sector.value = user.sector;
    } catch {
      // Ignore malformed localStorage data.
    }
  }

  function openCategoryModal() {
    elements.modal.classList.remove("hidden");
  }

  function closeCategoryModal() {
    elements.modal.classList.add("hidden");
  }

  function selectCategory(categoryKey) {
    const category = CONFIG[categoryKey];
    if (!category) return;

    state.category = categoryKey;
    elements.categoryBadge.textContent = category.label;

    fillSelect(
      elements.classLevel,
      category.classes.map((item) => ({ value: item.toLowerCase(), label: item })),
      "Select class"
    );

    fillSelect(elements.subject, category.subjects, "Select subject");

    elements.classLevel.disabled = false;
    elements.subject.disabled = false;
    closeCategoryModal();
    clearMessage();
  }

  function fillSelect(select, options, placeholder) {
    select.innerHTML = `<option value="">${placeholder}</option>`;
    options.forEach(({ value, label }) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    });
  }

  async function handleGenerate(event) {
    if (event?.preventDefault) event.preventDefault();

    if (!state.category) {
      showMessage("Please select a note category first.", "error");
      openCategoryModal();
      return;
    }

    const formData = readFormData();
    if (!validateForm(formData)) return;

    setLoading(true);
    clearMessage();

    try {
      ensurePdfLibLoaded();

      const availableFiles = await findAvailableVersions(
        formData.subject,
        formData.classLevel
      );

      if (availableFiles.length === 0) {
        throw new Error(
          `No PDF was found for ${getSubjectLabel(formData.subject)} ${formData.classLevel.toUpperCase()}. ` +
          `Add files such as notes/${formData.subject}/${formData.classLevel}_v1.pdf.`
        );
      }

      const chosen = chooseRandomVersion(availableFiles, state.selectedVersion);
      const sourceBytes = await fetchPdfBytes(chosen.path);
      const finalBytes = await buildBrandedPdf(sourceBytes, formData);

      state.generatedBlob = new Blob([finalBytes], { type: "application/pdf" });
      state.selectedVersion = chosen.version;
      state.lastFormData = formData;

      showResult(formData, chosen.version);
      saveTeacherDefaults(formData);
      showMessage("Notes generated successfully.", "success");
    } catch (error) {
      console.error(error);
      showMessage(error.message || "The notes could not be generated.", "error");
    } finally {
      setLoading(false);
    }
  }

  function readFormData() {
    return {
      teacherName: elements.teacherName.value.trim(),
      schoolName: elements.schoolName.value.trim(),
      academicYear: elements.academicYear.value,
      district: elements.district.value.trim(),
      sector: elements.sector.value.trim(),
      classLevel: elements.classLevel.value,
      subject: elements.subject.value
    };
  }

  function validateForm(data) {
    let valid = true;

    [
      ["teacherName", elements.teacherName],
      ["schoolName", elements.schoolName],
      ["academicYear", elements.academicYear],
      ["district", elements.district],
      ["sector", elements.sector],
      ["classLevel", elements.classLevel],
      ["subject", elements.subject]
    ].forEach(([key, field]) => {
      if (!data[key]) {
        field.classList.add("invalid");
        valid = false;
      }
    });

    if (!valid) {
      showMessage("Please complete all required fields.", "error");
    }

    return valid;
  }

  async function findAvailableVersions(subject, classLevel) {
    const candidates = Array.from({ length: MAX_VERSIONS }, (_, index) => {
      const version = index + 1;
      return {
        version,
        path: `./notes/${subject}/${classLevel}_v${version}.pdf`
      };
    });

    const checks = await Promise.all(
      candidates.map(async (candidate) => {
        try {
          const response = await fetch(candidate.path, {
            method: "HEAD",
            cache: "no-store"
          });
          return response.ok ? candidate : null;
        } catch {
          return null;
        }
      })
    );

    return checks.filter(Boolean);
  }

  function chooseRandomVersion(files, previousVersion) {
    let pool = files;
    if (files.length > 1 && previousVersion) {
      pool = files.filter((item) => item.version !== previousVersion);
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  async function fetchPdfBytes(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`The selected note file could not be opened: ${path}`);
    }
    return response.arrayBuffer();
  }

  async function buildBrandedPdf(sourceBytes, data) {
    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;

    const sourcePdf = await PDFDocument.load(sourceBytes);
    const finalPdf = await PDFDocument.create();

    const regular = await finalPdf.embedFont(StandardFonts.Helvetica);
    const bold = await finalPdf.embedFont(StandardFonts.HelveticaBold);

    addCoverPage(finalPdf, data, regular, bold, rgb);

    const pageIndices = sourcePdf.getPageIndices();
    const embeddedPages = await finalPdf.embedPdf(sourceBytes, pageIndices);

    embeddedPages.forEach((embeddedPage, index) => {
      const originalWidth = embeddedPage.width;
      const originalHeight = embeddedPage.height;
      const headerSpace = 42;
      const footerSpace = 58;

      const page = finalPdf.addPage([
        originalWidth,
        originalHeight + headerSpace + footerSpace
      ]);

      page.drawPage(embeddedPage, {
        x: 0,
        y: footerSpace,
        width: originalWidth,
        height: originalHeight
      });

      const width = page.getWidth();
      const height = page.getHeight();

      page.drawLine({
        start: { x: 30, y: height - 31 },
        end: { x: width - 30, y: height - 31 },
        thickness: 0.7,
        color: rgb(0.82, 0.85, 0.90)
      });

      page.drawText(
        `${getSubjectLabel(data.subject)} • ${data.classLevel.toUpperCase()} • ${data.academicYear}`,
        {
          x: 30,
          y: height - 23,
          size: 8,
          font: bold,
          color: rgb(0.25, 0.31, 0.42)
        }
      );

      const ownership =
        `This is the original work of Teacher ${data.teacherName} from ` +
        `${data.schoolName}, ${data.district} District, ${data.sector} Sector.`;

      page.drawLine({
        start: { x: 30, y: 48 },
        end: { x: width - 30, y: 48 },
        thickness: 0.7,
        color: rgb(0.82, 0.85, 0.90)
      });

      drawWrappedText(page, ownership, {
        x: 30,
        y: 35,
        maxWidth: width - 100,
        size: 7.3,
        lineHeight: 9,
        font: regular,
        color: rgb(0.27, 0.33, 0.43)
      });

      page.drawText(`${index + 1} / ${embeddedPages.length}`, {
        x: width - 62,
        y: 25,
        size: 7.5,
        font: bold,
        color: rgb(0.27, 0.33, 0.43)
      });
    });

    return finalPdf.save();
  }

  function addCoverPage(pdf, data, regular, bold, rgb) {
    const page = pdf.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.965, 0.976, 0.995)
    });

    page.drawRectangle({
      x: 0,
      y: height - 20,
      width,
      height: 20,
      color: rgb(0.082, 0.369, 0.937)
    });

    page.drawText("SCHOOLPINGO LEARNING MATERIALS", {
      x: 54,
      y: height - 94,
      size: 10,
      font: bold,
      color: rgb(0.082, 0.369, 0.937)
    });

    drawWrappedText(page, `${getSubjectLabel(data.subject)} Notes`, {
      x: 54,
      y: height - 165,
      maxWidth: width - 108,
      size: 34,
      lineHeight: 40,
      font: bold,
      color: rgb(0.08, 0.13, 0.24)
    });

    page.drawText(`${data.classLevel.toUpperCase()} • Academic Year ${data.academicYear}`, {
      x: 54,
      y: height - 225,
      size: 15,
      font: regular,
      color: rgb(0.35, 0.42, 0.54)
    });

    page.drawRectangle({
      x: 54,
      y: 210,
      width: width - 108,
      height: 220,
      borderWidth: 1,
      borderColor: rgb(0.82, 0.86, 0.93),
      color: rgb(1, 1, 1)
    });

    const rows = [
      ["Prepared by", `Teacher ${data.teacherName}`],
      ["School", data.schoolName],
      ["Location", `${data.sector} Sector, ${data.district} District`],
      ["Category", CONFIG[state.category].label]
    ];

    let y = 385;
    rows.forEach(([label, value]) => {
      page.drawText(label.toUpperCase(), {
        x: 80,
        y,
        size: 8,
        font: bold,
        color: rgb(0.39, 0.46, 0.57)
      });

      drawWrappedText(page, value, {
        x: 80,
        y: y - 22,
        maxWidth: width - 160,
        size: 13,
        lineHeight: 16,
        font: bold,
        color: rgb(0.08, 0.13, 0.24)
      });

      y -= 49;
    });

    page.drawText(`Generated ${new Date().getFullYear()} • Protected learning material`, {
      x: 54,
      y: 58,
      size: 8.5,
      font: regular,
      color: rgb(0.42, 0.48, 0.58)
    });
  }

  function drawWrappedText(page, text, options) {
    const {
      x, y, maxWidth, size, lineHeight, font, color
    } = options;

    const words = String(text).split(/\s+/);
    const lines = [];
    let current = "";

    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    });

    if (current) lines.push(current);

    lines.forEach((line, index) => {
      page.drawText(line, {
        x,
        y: y - index * lineHeight,
        size,
        font,
        color
      });
    });
  }

  function showResult(data, version) {
    cleanupPreviewUrl();

    state.previewUrl = URL.createObjectURL(state.generatedBlob);
    elements.pdfPreview.src = state.previewUrl;
    elements.versionBadge.textContent = `Version ${version}`;

    const subjectName = getSubjectLabel(data.subject).replace(/\s+/g, "-");
    elements.fileName.value =
      `${subjectName}-${data.classLevel.toUpperCase()}-${data.academicYear}`;

    elements.resultPanel.classList.remove("hidden");
    elements.resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function downloadGeneratedNotes() {
    if (!state.generatedBlob) {
      showMessage("Generate the notes before downloading.", "error");
      return;
    }

    const safeName = sanitizeFileName(elements.fileName.value);
    if (!safeName) {
      elements.fileName.classList.add("invalid");
      return;
    }

    const link = document.createElement("a");
    const url = URL.createObjectURL(state.generatedBlob);
    link.href = url;
    link.download = `${safeName}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function sanitizeFileName(value) {
    return String(value)
      .trim()
      .replace(/\.pdf$/i, "")
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function getSubjectLabel(value) {
    const allSubjects = [
      ...CONFIG.primary.subjects,
      ...CONFIG.ordinary.subjects
    ];
    return allSubjects.find((subject) => subject.value === value)?.label || value;
  }

  function setLoading(loading) {
    elements.getNotesBtn.disabled = loading;
    elements.generateAnotherBtn.disabled = loading;
    elements.getNotesBtn.classList.toggle("is-loading", loading);
    elements.generateAnotherBtn.classList.toggle("is-loading", loading);
  }

  function showMessage(text, type) {
    elements.formMessage.textContent = text;
    elements.formMessage.className = `message show ${type}`;
  }

  function clearMessage() {
    elements.formMessage.textContent = "";
    elements.formMessage.className = "message";
  }

  function cleanupPreviewUrl() {
    if (state.previewUrl) {
      URL.revokeObjectURL(state.previewUrl);
      state.previewUrl = null;
    }
  }

  function saveTeacherDefaults(data) {
    const existing = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({
      ...existing,
      full_name: data.teacherName,
      school_name: data.schoolName,
      district: data.district,
      sector: data.sector
    }));
  }

  function ensurePdfLibLoaded() {
    if (!window.PDFLib) {
      throw new Error(
        "The PDF library did not load. Check your internet connection and refresh the page."
      );
    }
  }
})();
