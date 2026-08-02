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
        {
          value: "entrepreneurship",
          label: "Entrepreneurship"
        },
        { value: "physics", label: "Physics" }
      ]
    }
  };

  const MAX_VERSIONS = 5;
  const NOTE_PRICE = 500;

  const PROFILE_API =
    "/.netlify/functions/get-user-profile";

  const NOTE_PAYMENT_API =
    "/.netlify/functions/note-payment";

  const LOGIN_PAGE =
    "../login.html";

  const state = {
    category: null,
    generatedBlob: null,
    previewUrl: null,
    selectedVersion: null,
    lastFormData: null,
    loggedInUser: null,
    profileLoading: false,

    notePaymentId: null,
    notePaymentStatus: null,
    paymentChecking: false,
    paymentCreating: false,
    downloadAuthorizing: false,
    downloadUsed: false
  };

  const elements = {
    modal:
      document.getElementById(
        "categoryModal"
      ),

    categoryOptions:
      document.querySelectorAll(
        ".category-option"
      ),

    categoryBadge:
      document.getElementById(
        "selectedCategoryBadge"
      ),

    changeCategoryBtn:
      document.getElementById(
        "changeCategoryBtn"
      ),

    form:
      document.getElementById(
        "notesForm"
      ),

    teacherName:
      document.getElementById(
        "teacherName"
      ),

    teacherPhone:
      document.getElementById(
        "teacherPhone"
      ),

    teacherEmail:
      document.getElementById(
        "teacherEmail"
      ),

    schoolName:
      document.getElementById(
        "schoolName"
      ),

    academicYear:
      document.getElementById(
        "academicYear"
      ),

    district:
      document.getElementById(
        "district"
      ),

    sector:
      document.getElementById(
        "sector"
      ),

    classLevel:
      document.getElementById(
        "classLevel"
      ),

    subject:
      document.getElementById(
        "subject"
      ),

    getNotesBtn:
      document.getElementById(
        "getNotesBtn"
      ),

    formMessage:
      document.getElementById(
        "formMessage"
      ),

    resultPanel:
      document.getElementById(
        "resultPanel"
      ),

    pdfPreview:
      document.getElementById(
        "pdfPreview"
      ),

    fileName:
      document.getElementById(
        "fileName"
      ),

    downloadBtn:
      document.getElementById(
        "downloadBtn"
      ),

    generateAnotherBtn:
      document.getElementById(
        "generateAnotherBtn"
      ),

    versionBadge:
      document.getElementById(
        "versionBadge"
      )
  };

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

  async function init() {
    populateAcademicYears();
    bindEvents();

    try {
      await loadLoggedInUser();
    } catch (error) {
      console.error(
        "Authentication error:",
        error
      );

      localStorage.setItem(
        "redirectAfterLogin",
        window.location.href
      );

      showMessage(
        error.message ||
          "You must log in before generating notes.",
        "error"
      );

      setTimeout(() => {
        window.location.href =
          LOGIN_PAGE;
      }, 1200);
    }
  }

  function bindEvents() {
    elements.categoryOptions.forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            selectCategory(
              button.dataset.category
            );
          }
        );
      }
    );

    elements.changeCategoryBtn
      ?.addEventListener(
        "click",
        openCategoryModal
      );

    elements.form
      ?.addEventListener(
        "submit",
        handleGenerate
      );

    elements.downloadBtn
      ?.addEventListener(
        "click",
        handlePaidDownload
      );

    elements.generateAnotherBtn
      ?.addEventListener(
        "click",
        handleGenerate
      );

    elements.form
      ?.querySelectorAll(
        "input, select"
      )
      .forEach((field) => {
        field.addEventListener(
          "input",
          () => {
            field.classList.remove(
              "invalid"
            );
          }
        );

        field.addEventListener(
          "change",
          () => {
            field.classList.remove(
              "invalid"
            );
          }
        );
      });

    window.addEventListener(
      "beforeunload",
      cleanupPreviewUrl
    );
  }

  function populateAcademicYears() {
    if (!elements.academicYear) {
      return;
    }

    const currentYear =
      new Date().getFullYear();

    for (
      let year = currentYear - 1;
      year <= currentYear + 3;
      year += 1
    ) {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        `${year}-${year + 1}`;

      option.textContent =
        `${year}-${year + 1}`;

      if (year === currentYear) {
        option.selected = true;
      }

      elements.academicYear
        .appendChild(option);
    }
  }

  async function loadLoggedInUser() {
    if (state.profileLoading) {
      return;
    }

    state.profileLoading = true;

    try {
      const isLoggedIn =
        localStorage.getItem(
          "isLoggedIn"
        ) === "true";

      const token =
        localStorage.getItem(
          "auth_token"
        );

      const userId =
        localStorage.getItem(
          "userId"
        );

      const email =
        localStorage.getItem(
          "user_email"
        );

      if (!isLoggedIn || !token) {
        clearAuthenticationData();

        throw new Error(
          "You must log in before generating notes."
        );
      }

      if (!userId && !email) {
        clearAuthenticationData();

        throw new Error(
          "Your logged-in account information is incomplete."
        );
      }

      const query =
        userId
          ? `user=${encodeURIComponent(
              userId
            )}`
          : `email=${encodeURIComponent(
              email
            )}`;

      const response =
        await fetch(
          `${PROFILE_API}?${query}`,
          {
            method: "GET",

            headers: {
              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`
            },

            cache:
              "no-store"
          }
        );

      let data;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid profile response."
        );
      }

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          clearAuthenticationData();
        }

        throw new Error(
          data.error ||
            data.message ||
            "Your account profile could not be loaded."
        );
      }

      if (!data.name) {
        throw new Error(
          "Your profile does not contain a user name."
        );
      }

      state.loggedInUser = {
        id:
          userId ||
          data.id ||
          null,

        name:
          data.name,

        email:
          data.email ||
          email ||
          "",

        phone:
          data.phone ||
          "",

        balance:
          data.balance ?? null
      };

      showLoggedInUser();
    } finally {
      state.profileLoading =
        false;
    }
  }

  function clearAuthenticationData() {
    localStorage.removeItem(
      "isLoggedIn"
    );

    localStorage.removeItem(
      "auth_token"
    );

    localStorage.removeItem(
      "user_email"
    );

    localStorage.removeItem(
      "userId"
    );
  }

  function showLoggedInUser() {
    const user =
      state.loggedInUser;

    if (!user) {
      return;
    }

    if (elements.teacherName) {
      elements.teacherName.value =
        user.name || "";

      elements.teacherName.readOnly =
        true;
    }

    if (elements.teacherPhone) {
      elements.teacherPhone.value =
        user.phone || "";

      elements.teacherPhone.readOnly =
        true;
    }

    if (elements.teacherEmail) {
      elements.teacherEmail.value =
        user.email || "";

      elements.teacherEmail.readOnly =
        true;
    }
  }

  function openCategoryModal() {
    elements.modal
      ?.classList.remove(
        "hidden"
      );
  }

  function closeCategoryModal() {
    elements.modal
      ?.classList.add(
        "hidden"
      );
  }

  function selectCategory(
    categoryKey
  ) {
    const category =
      CONFIG[categoryKey];

    if (!category) {
      return;
    }

    state.category =
      categoryKey;

    if (elements.categoryBadge) {
      elements.categoryBadge
        .textContent =
        category.label;
    }

    fillSelect(
      elements.classLevel,

      category.classes.map(
        (item) => ({
          value:
            item.toLowerCase(),

          label:
            item
        })
      ),

      "Select class"
    );

    fillSelect(
      elements.subject,
      category.subjects,
      "Select subject"
    );

    if (elements.classLevel) {
      elements.classLevel.disabled =
        false;
    }

    if (elements.subject) {
      elements.subject.disabled =
        false;
    }

    closeCategoryModal();
    resetNotePaymentState();
    clearMessage();
  }

  function fillSelect(
    select,
    options,
    placeholder
  ) {
    if (!select) {
      return;
    }

    select.innerHTML =
      `<option value="">${placeholder}</option>`;

    options.forEach(
      ({ value, label }) => {
        const option =
          document.createElement(
            "option"
          );

        option.value =
          value;

        option.textContent =
          label;

        select.appendChild(
          option
        );
      }
    );
  }

  async function handleGenerate(
    event
  ) {
    if (
      event?.preventDefault
    ) {
      event.preventDefault();
    }

    if (
      !state.loggedInUser
    ) {
      localStorage.setItem(
        "redirectAfterLogin",
        window.location.href
      );

      showMessage(
        "Your login session could not be verified. Please log in again.",
        "error"
      );

      setTimeout(() => {
        window.location.href =
          LOGIN_PAGE;
      }, 1200);

      return;
    }

    if (!state.category) {
      showMessage(
        "Please select a note category first.",
        "error"
      );

      openCategoryModal();

      return;
    }

    let formData;

    try {
      formData =
        readFormData();
    } catch (error) {
      showMessage(
        error.message,
        "error"
      );

      return;
    }

    if (
      !validateForm(
        formData
      )
    ) {
      return;
    }

    setLoading(true);
    clearMessage();

    try {
      ensurePdfLibLoaded();

      console.log(
        "Step 1: Checking available note versions."
      );

      const availableFiles =
        await findAvailableVersions(
          formData.subject,
          formData.classLevel
        );

      console.log(
        "Step 2: Available note versions:",
        availableFiles
      );

      if (
        availableFiles.length === 0
      ) {
        throw new Error(
          `No PDF was found for ${getSubjectLabel(
            formData.subject
          )} ${formData.classLevel.toUpperCase()}. ` +
          `Add files such as notes/${formData.subject}/${formData.classLevel}_v1.pdf.`
        );
      }

      const chosen =
        chooseRandomVersion(
          availableFiles,
          state.selectedVersion
        );

      if (!chosen) {
        throw new Error(
          "An available note version could not be selected."
        );
      }

      console.log(
        "Step 3: Selected note:",
        chosen
      );

      const sourceBytes =
        await fetchPdfBytes(
          chosen.path
        );

      console.log(
        "Step 4: Original PDF loaded."
      );

      const finalBytes =
        await buildBrandedPdf(
          sourceBytes,
          formData
        );

      console.log(
        "Step 5: Branded PDF generated."
      );

      state.generatedBlob =
        new Blob(
          [finalBytes],
          {
            type:
              "application/pdf"
          }
        );

      state.selectedVersion =
        chosen.version;

      state.lastFormData =
        formData;

      resetNotePaymentState();

      showResult(
        formData,
        chosen.version
      );

      updateDownloadButton(
        `Pay ${NOTE_PRICE} RWF & Download`,
        false
      );

      showMessage(
        `Notes generated successfully. Pay ${NOTE_PRICE} RWF to unlock one download.`,
        "success"
      );
    } catch (error) {
      console.error(
        "Notes generation error:",
        error
      );

      showMessage(
        error.message ||
          "The notes could not be generated.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  function readFormData() {
    const user =
      state.loggedInUser;

    if (!user) {
      throw new Error(
        "You must log in before generating notes."
      );
    }

    return {
      teacherName:
        user.name || "",

      teacherPhone:
        user.phone || "",

      teacherEmail:
        user.email || "",

      schoolName:
        elements.schoolName
          ?.value.trim() || "",

      academicYear:
        elements.academicYear
          ?.value || "",

      district:
        elements.district
          ?.value.trim() || "",

      sector:
        elements.sector
          ?.value.trim() || "",

      classLevel:
        elements.classLevel
          ?.value || "",

      subject:
        elements.subject
          ?.value || ""
    };
  }

  function validateForm(data) {
    let valid = true;

    const requiredFields = [
      [
        "schoolName",
        elements.schoolName
      ],

      [
        "academicYear",
        elements.academicYear
      ],

      [
        "district",
        elements.district
      ],

      [
        "sector",
        elements.sector
      ],

      [
        "classLevel",
        elements.classLevel
      ],

      [
        "subject",
        elements.subject
      ]
    ];

    requiredFields.forEach(
      ([key, field]) => {
        if (!data[key]) {
          field?.classList.add(
            "invalid"
          );

          valid = false;
        }
      }
    );

    if (!data.teacherName) {
      showMessage(
        "Your account profile does not contain your name.",
        "error"
      );

      return false;
    }

    if (!data.teacherPhone) {
      showMessage(
        "Your account profile does not contain a phone number.",
        "error"
      );

      return false;
    }

    if (!data.teacherEmail) {
      showMessage(
        "Your account profile does not contain an email address.",
        "error"
      );

      return false;
    }

    if (!valid) {
      showMessage(
        "Please complete all required fields.",
        "error"
      );
    }

    return valid;
  }

        async function findAvailableVersions(
  subject,
  classLevel
) {
  const candidates = Array.from(
    { length: MAX_VERSIONS },
    (_, index) => {
      const version = index + 1;

      return {
        version,
        path:
          `./notes/${subject}/${classLevel}_v${version}.pdf`
      };
    }
  );

  const checks = await Promise.all(
    candidates.map(
      async candidate => {
        try {
          const response = await fetch(
            candidate.path,
            {
              method: "HEAD",
              cache: "no-store"
            }
          );

          return response.ok
            ? candidate
            : null;
        } catch (error) {
          console.warn(
            `Could not check ${candidate.path}:`,
            error
          );

          return null;
        }
      }
    )
  );

  return checks.filter(Boolean);
}          

  function chooseRandomVersion(
    files,
    previousVersion
  ) {
    let pool =
      files;

    if (
      files.length > 1 &&
      previousVersion
    ) {
      pool =
        files.filter(
          (item) =>
            item.version !==
            previousVersion
        );
    }

    if (!pool.length) {
      pool =
        files;
    }

    const randomIndex =
      Math.floor(
        Math.random() *
          pool.length
      );

    return pool[
      randomIndex
    ];
  }

  async function fetchPdfBytes(
  path
) {
  const response =
    await fetch(
      path,
      {
        cache:
          "no-store"
      }
    );

  if (!response.ok) {
    throw new Error(
      `The selected note file could not be opened: ${path}`
    );
  }

  return response.arrayBuffer();
  }
  
  async function handlePaidDownload() {
    if (
      !state.generatedBlob ||
      !state.lastFormData ||
      !state.selectedVersion
    ) {
      showMessage(
        "Generate the notes before downloading.",
        "error"
      );

      return;
    }

    if (!state.loggedInUser) {
      localStorage.setItem(
        "redirectAfterLogin",
        window.location.href
      );

      showMessage(
        "You must log in before purchasing notes.",
        "error"
      );

      setTimeout(() => {
        window.location.href =
          LOGIN_PAGE;
      }, 1200);

      return;
    }

    if (state.downloadUsed) {
      showMessage(
        "The one permitted download has already been used.",
        "error"
      );

      updateDownloadButton(
        "Download Already Used",
        true
      );

      return;
    }

    if (!state.notePaymentId) {
      await createNotePayment();
      return;
    }

    await checkNotePayment();
  }

  async function createNotePayment() {
    if (
      state.paymentCreating ||
      !state.lastFormData
    ) {
      return;
    }

    state.paymentCreating =
      true;

    updateDownloadButton(
      "Creating Payment...",
      true
    );

    try {
      const data =
        state.lastFormData;

      const response =
        await fetch(
          `${NOTE_PAYMENT_API}?action=create`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${getAuthToken()}`
            },

            body:
              JSON.stringify({
                category:
                  state.category,

                classLevel:
                  data.classLevel,

                subject:
                  data.subject,

                noteVersion:
                  state.selectedVersion,

                academicYear:
                  data.academicYear,

                schoolName:
                  data.schoolName,

                district:
                  data.district,

                sector:
                  data.sector
              })
          }
        );

      const result =
        await parseApiResponse(
          response
        );

      if (!response.ok) {
        handlePossibleAuthFailure(
          response
        );

        throw new Error(
          result.message ||
            result.error ||
            "The payment request could not be created."
        );
      }

      const paymentId =
        Number(
          result.paymentId ||
            result.payment?.id
        );

      if (
        !Number.isInteger(
          paymentId
        ) ||
        paymentId <= 0
      ) {
        throw new Error(
          "The server did not return a valid payment ID."
        );
      }

      state.notePaymentId =
        paymentId;

      state.notePaymentStatus =
        result.status ||
        result.payment?.status ||
        "initiated";

      if (
        state.notePaymentStatus ===
        "approved"
      ) {
        showMessage(
          "This payment is already approved. Tap the button again to download.",
          "success"
        );

        updateDownloadButton(
          "Download Notes",
          false
        );

        return;
      }

      showMessage(
        `Payment request created for ${NOTE_PRICE} RWF. Make the payment and wait for admin confirmation.`,
        "success"
      );

      updateDownloadButton(
        "Check Payment Status",
        false
      );
    } catch (error) {
      console.error(
        "Create note payment error:",
        error
      );

      showMessage(
        error.message,
        "error"
      );

      updateDownloadButton(
        `Pay ${NOTE_PRICE} RWF & Download`,
        false
      );
    } finally {
      state.paymentCreating =
        false;
    }
  }

  async function checkNotePayment() {
    if (
      !state.notePaymentId ||
      state.paymentChecking
    ) {
      return;
    }

    state.paymentChecking =
      true;

    updateDownloadButton(
      "Checking Payment...",
      true
    );

    try {
      const response =
        await fetch(
          `${NOTE_PAYMENT_API}?action=check&paymentId=${encodeURIComponent(
            state.notePaymentId
          )}`,
          {
            method:
              "GET",

            headers: {
              Accept:
                "application/json",

              Authorization:
                `Bearer ${getAuthToken()}`
            },

            cache:
              "no-store"
          }
        );

      const result =
        await parseApiResponse(
          response
        );

      if (!response.ok) {
        handlePossibleAuthFailure(
          response
        );

        throw new Error(
          result.message ||
            result.error ||
            "The payment status could not be checked."
        );
      }

      state.notePaymentStatus =
        result.status;

      if (
        result.status ===
        "initiated"
      ) {
        showMessage(
          "Your payment is still waiting for admin confirmation.",
          "error"
        );

        updateDownloadButton(
          "Check Payment Status",
          false
        );

        return;
      }

      if (
        result.status ===
        "rejected"
      ) {
        showMessage(
          "Your payment was rejected. Contact support or create a new payment request.",
          "error"
        );

        state.notePaymentId =
          null;

        state.notePaymentStatus =
          null;

        updateDownloadButton(
          `Pay ${NOTE_PRICE} RWF & Download`,
          false
        );

        return;
      }

      if (
        result.status ===
          "downloaded" ||
        Number(
          result.downloadCount
        ) >=
          Number(
            result.downloadLimit
          )
      ) {
        state.downloadUsed =
          true;

        showMessage(
          "The one permitted download has already been used.",
          "error"
        );

        updateDownloadButton(
          "Download Already Used",
          true
        );

        return;
      }

      if (
        result.status ===
          "approved" &&
        result.canDownload !==
          false
      ) {
        showMessage(
          "Payment approved. Preparing your download.",
          "success"
        );

        await authorizeAndDownload();

        return;
      }

      throw new Error(
        "The payment is not available for downloading."
      );
    } catch (error) {
      console.error(
        "Check note payment error:",
        error
      );

      showMessage(
        error.message,
        "error"
      );

      if (!state.downloadUsed) {
        updateDownloadButton(
          "Check Payment Status",
          false
        );
      }
    } finally {
      state.paymentChecking =
        false;
    }
  }

  async function authorizeAndDownload() {
    if (
      !state.notePaymentId ||
      state.downloadAuthorizing ||
      state.downloadUsed
    ) {
      return;
    }

    const safeName =
      sanitizeFileName(
        elements.fileName
          ?.value || ""
      );

    if (!safeName) {
      elements.fileName
        ?.classList.add(
          "invalid"
        );

      showMessage(
        "Please enter a valid file name.",
        "error"
      );

      updateDownloadButton(
        "Download Notes",
        false
      );

      return;
    }

    state.downloadAuthorizing =
      true;

    updateDownloadButton(
      "Authorizing Download...",
      true
    );

    try {
      const response =
        await fetch(
          `${NOTE_PAYMENT_API}?action=download`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${getAuthToken()}`
            },

            body:
              JSON.stringify({
                paymentId:
                  state.notePaymentId
              })
          }
        );

      const result =
        await parseApiResponse(
          response
        );

      if (!response.ok) {
        handlePossibleAuthFailure(
          response
        );

        if (
          result.status ===
          "downloaded"
        ) {
          state.downloadUsed =
            true;

          updateDownloadButton(
            "Download Already Used",
            true
          );
        }

        throw new Error(
          result.message ||
            result.error ||
            "The download could not be authorized."
        );
      }

      if (!result.authorized) {
        throw new Error(
          "The server did not authorize this download."
        );
      }

      downloadGeneratedNotes(
        safeName
      );

      state.downloadUsed =
        true;

      state.notePaymentStatus =
        "downloaded";

      updateDownloadButton(
        "Download Used",
        true
      );

      showMessage(
        "Your notes were downloaded successfully. This purchase allowed one download.",
        "success"
      );
    } catch (error) {
      console.error(
        "Authorize note download error:",
        error
      );

      showMessage(
        error.message,
        "error"
      );

      if (!state.downloadUsed) {
        updateDownloadButton(
          "Check Payment Status",
          false
        );
      }
    } finally {
      state.downloadAuthorizing =
        false;
    }
  }

  async function buildBrandedPdf(
    sourceBytes,
    data
  ) {
    const {
      PDFDocument,
      StandardFonts,
      rgb
    } =
      window.PDFLib;

    const sourcePdf =
      await PDFDocument.load(
        sourceBytes
      );

    const finalPdf =
      await PDFDocument.create();

    const regular =
      await finalPdf.embedFont(
        StandardFonts.Helvetica
      );

    const bold =
      await finalPdf.embedFont(
        StandardFonts.HelveticaBold
      );

    addCoverPage(
      finalPdf,
      data,
      regular,
      bold,
      rgb
    );

    const pageIndices =
      sourcePdf.getPageIndices();

    const embeddedPages =
      await finalPdf.embedPdf(
        sourceBytes,
        pageIndices
      );

    embeddedPages.forEach(
      (
        embeddedPage,
        index
      ) => {
        const originalWidth =
          embeddedPage.width;

        const originalHeight =
          embeddedPage.height;

        const headerSpace =
          42;

        const footerSpace =
          68;

        const page =
          finalPdf.addPage([
            originalWidth,
            originalHeight +
              headerSpace +
              footerSpace
          ]);

        page.drawPage(
          embeddedPage,
          {
            x: 0,
            y: footerSpace,
            width:
              originalWidth,
            height:
              originalHeight
          }
        );

        const width =
          page.getWidth();

        const height =
          page.getHeight();

        page.drawLine({
          start: {
            x: 30,
            y:
              height - 31
          },

          end: {
            x:
              width - 30,
            y:
              height - 31
          },

          thickness:
            0.7,

          color:
            rgb(
              0.82,
              0.85,
              0.9
            )
        });

        page.drawText(
          `${getSubjectLabel(
            data.subject
          )} • ${data.classLevel.toUpperCase()} • ${data.academicYear}`,
          {
            x: 30,
            y:
              height - 23,
            size: 8,
            font:
              bold,
            color:
              rgb(
                0.25,
                0.31,
                0.42
              )
          }
        );

        const ownership =
          `This is the original work of Teacher ${data.teacherName} from ` +
          `${data.schoolName}, ${data.district} District, ${data.sector} Sector. ` +
          `Contact: ${data.teacherPhone} | ${data.teacherEmail}.`;

        page.drawLine({
          start: {
            x: 30,
            y: 58
          },

          end: {
            x:
              width - 30,
            y: 58
          },

          thickness:
            0.7,

          color:
            rgb(
              0.82,
              0.85,
              0.9
            )
        });

        drawWrappedText(
          page,
          ownership,
          {
            x: 30,
            y: 45,
            maxWidth:
              width - 105,
            size: 7.2,
            lineHeight: 9,
            font:
              regular,
            color:
              rgb(
                0.27,
                0.33,
                0.43
              )
          }
        );

        page.drawText(
          `${index + 1} / ${embeddedPages.length}`,
          {
            x:
              width - 65,
            y: 29,
            size: 7.5,
            font:
              bold,
            color:
              rgb(
                0.27,
                0.33,
                0.43
              )
          }
        );
      }
    );

    return finalPdf.save();
  }

  function addCoverPage(
    pdf,
    data,
    regular,
    bold,
    rgb
  ) {
    const page =
      pdf.addPage([
        595.28,
        841.89
      ]);

    const {
      width,
      height
    } =
      page.getSize();

    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,

      color:
        rgb(
          0.965,
          0.976,
          0.995
        )
    });

    page.drawRectangle({
      x: 0,
      y:
        height - 20,
      width,
      height: 20,

      color:
        rgb(
          0.082,
          0.369,
          0.937
        )
    });

    page.drawText(
      `${data.academicYear}, ${data.classLevel.toUpperCase()}`,
      {
        x: 54,
        y:
          height - 94,
        size: 10,
        font:
          bold,

        color:
          rgb(
            0.082,
            0.369,
            0.937
          )
      }
    );

    drawWrappedText(
      page,
      `${getSubjectLabel(
        data.subject
      )} Notes`,
      {
        x: 54,
        y:
          height - 165,
        maxWidth:
          width - 108,
        size: 34,
        lineHeight: 40,
        font:
          bold,

        color:
          rgb(
            0.08,
            0.13,
            0.24
          )
      }
    );

    page.drawText(
      `${data.classLevel.toUpperCase()}, Academic Year ${data.academicYear}`,
      {
        x: 54,
        y:
          height - 225,
        size: 15,
        font:
          regular,

        color:
          rgb(
            0.35,
            0.42,
            0.54
          )
      }
    );

    page.drawRectangle({
      x: 54,
      y: 130,
      width:
        width - 108,
      height: 330,

      borderWidth: 1,

      borderColor:
        rgb(
          0.82,
          0.86,
          0.93
        ),

      color:
        rgb(
          1,
          1,
          1
        )
    });

    const rows = [
      [
        "Prepared by",
        `Teacher ${data.teacherName}`
      ],

      [
        "Phone",
        data.teacherPhone
      ],

      [
        "Email",
        data.teacherEmail
      ],

      [
        "School",
        data.schoolName
      ],

      [
        "Location",
        `${data.sector} Sector, ${data.district} District`
      ],

      [
        "Category",
        CONFIG[
          state.category
        ].label
      ]
    ];

    let y = 420;

    rows.forEach(
      ([label, value]) => {
        page.drawText(
          label.toUpperCase(),
          {
            x: 80,
            y,
            size: 8,
            font:
              bold,

            color:
              rgb(
                0.39,
                0.46,
                0.57
              )
          }
        );

        drawWrappedText(
          page,
          value ||
            "Not provided",
          {
            x: 80,
            y:
              y - 20,
            maxWidth:
              width - 160,
            size: 12,
            lineHeight: 15,
            font:
              bold,

            color:
              rgb(
                0.08,
                0.13,
                0.24
              )
          }
        );

        y -= 48;
      }
    );

    page.drawText(
      `Prepared in ${new Date().getFullYear()} by Teacher ${data.teacherName}`,
      {
        x: 54,
        y: 58,
        size: 8.5,
        font:
          regular,

        color:
          rgb(
            0.42,
            0.48,
            0.58
          )
      }
    );
  }

  function drawWrappedText(
    page,
    text,
    options
  ) {
    const {
      x,
      y,
      maxWidth,
      size,
      lineHeight,
      font,
      color
    } =
      options;

    const words =
      String(
        text || ""
      ).split(/\s+/);

    const lines = [];

    let current =
      "";

    words.forEach(
      (word) => {
        const candidate =
          current
            ? `${current} ${word}`
            : word;

        if (
          font.widthOfTextAtSize(
            candidate,
            size
          ) <= maxWidth
        ) {
          current =
            candidate;
        } else {
          if (current) {
            lines.push(
              current
            );
          }

          current =
            word;
        }
      }
    );

    if (current) {
      lines.push(
        current
      );
    }

    lines.forEach(
      (
        line,
        index
      ) => {
        page.drawText(
          line,
          {
            x,
            y:
              y -
              index *
                lineHeight,
            size,
            font,
            color
          }
        );
      }
    );
  }

  function showResult(
    data,
    version
  ) {
    cleanupPreviewUrl();

    state.previewUrl =
      URL.createObjectURL(
        state.generatedBlob
      );

    if (
      elements.pdfPreview
    ) {
      elements.pdfPreview.src =
        state.previewUrl;
    }

    if (
      elements.versionBadge
    ) {
      elements.versionBadge
        .textContent =
        `Version ${version}`;
    }

    const subjectName =
      getSubjectLabel(
        data.subject
      ).replace(
        /\s+/g,
        "-"
      );

    if (
      elements.fileName
    ) {
      elements.fileName.value =
        `${subjectName}-${data.classLevel.toUpperCase()}-${data.academicYear}`;
    }

    elements.resultPanel
      ?.classList.remove(
        "hidden"
      );

    elements.resultPanel
      ?.scrollIntoView({
        behavior:
          "smooth",

        block:
          "start"
      });
  }

  function downloadGeneratedNotes(
    preparedFileName = ""
  ) {
    if (
      !state.generatedBlob
    ) {
      showMessage(
        "Generate the notes before downloading.",
        "error"
      );

      return;
    }

    const safeName =
      preparedFileName ||
      sanitizeFileName(
        elements.fileName
          ?.value || ""
      );

    if (!safeName) {
      elements.fileName
        ?.classList.add(
          "invalid"
        );

      showMessage(
        "Please enter a valid file name.",
        "error"
      );

      return;
    }

    const link =
      document.createElement(
        "a"
      );

    const url =
      URL.createObjectURL(
        state.generatedBlob
      );

    link.href =
      url;

    link.download =
      `${safeName}.pdf`;

    document.body
      .appendChild(
        link
      );

    link.click();
    link.remove();

    setTimeout(
      () => {
        URL.revokeObjectURL(
          url
        );
      },
      1000
    );
  }

  function resetNotePaymentState() {
    state.notePaymentId =
      null;

    state.notePaymentStatus =
      null;

    state.paymentChecking =
      false;

    state.paymentCreating =
      false;

    state.downloadAuthorizing =
      false;

    state.downloadUsed =
      false;
  }

  function updateDownloadButton(
    text,
    disabled
  ) {
    if (!elements.downloadBtn) {
      return;
    }

    elements.downloadBtn.textContent =
      text;

    elements.downloadBtn.disabled =
      disabled;

    elements.downloadBtn
      .classList.toggle(
        "disabled",
        disabled
      );
  }

  function getAuthToken() {
    const token =
      localStorage.getItem(
        "auth_token"
      );

    if (!token) {
      throw new Error(
        "Your login session is missing. Please log in again."
      );
    }

    return token;
  }

  async function parseApiResponse(
    response
  ) {
    try {
      return await response.json();
    } catch {
      return {
        success: false,
        message:
          "The server returned an invalid response."
      };
    }
  }

  function handlePossibleAuthFailure(
    response
  ) {
    if (
      response.status !== 401 &&
      response.status !== 403
    ) {
      return;
    }

    if (
      response.status === 401
    ) {
      clearAuthenticationData();

      localStorage.setItem(
        "redirectAfterLogin",
        window.location.href
      );
    }
  }

  function sanitizeFileName(
    value
  ) {
    return String(
      value
    )
      .trim()

      .replace(
        /\.pdf$/i,
        ""
      )

      .replace(
        /[<>:"/\\|?*\u0000-\u001F]/g,
        ""
      )

      .replace(
        /\s+/g,
        "-"
      )

      .replace(
        /-+/g,
        "-"
      );
  }

  function getSubjectLabel(
    value
  ) {
    const allSubjects = [
      ...CONFIG.primary.subjects,
      ...CONFIG.ordinary.subjects
    ];

    return (
      allSubjects.find(
        (subject) =>
          subject.value ===
          value
      )?.label ||
      value
    );
  }

  function setLoading(
    loading
  ) {
    if (
      elements.getNotesBtn
    ) {
      elements.getNotesBtn.disabled =
        loading;

      elements.getNotesBtn
        .classList.toggle(
          "is-loading",
          loading
        );
    }

    if (
      elements.generateAnotherBtn
    ) {
      elements.generateAnotherBtn.disabled =
        loading;

      elements.generateAnotherBtn
        .classList.toggle(
          "is-loading",
          loading
        );
    }
  }

  function showMessage(
    text,
    type
  ) {
    if (
      !elements.formMessage
    ) {
      return;
    }

    elements.formMessage
      .textContent =
      text;

    elements.formMessage
      .className =
      `message show ${type}`;
  }

  function clearMessage() {
    if (
      !elements.formMessage
    ) {
      return;
    }

    elements.formMessage
      .textContent =
      "";

    elements.formMessage
      .className =
      "message";
  }

  function cleanupPreviewUrl() {
    if (
      state.previewUrl
    ) {
      URL.revokeObjectURL(
        state.previewUrl
      );

      state.previewUrl =
        null;
    }
  }

  function ensurePdfLibLoaded() {
    if (
      !window.PDFLib
    ) {
      throw new Error(
        "The PDF library did not load. Check your internet connection and refresh the page."
      );
    }
  }
})();
