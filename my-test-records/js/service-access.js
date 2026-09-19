/* ============================================================
   FILA MARKS SYSTEM
   SERVICE ACCESS CONTROL
   ============================================================

   PURPOSE:
   Restrict selected pages to users who have at least
   10 lesson plans available on their balance.

   LOGIN:
   Uses:
       localStorage.getItem("auth_token")
       localStorage.getItem("user_email")

   BALANCE:
   Uses:
       /.netlify/functions/get-balance?email=USER_EMAIL

   HOW TO USE:

   Add this before </body> on any page you want to protect:

       <script src="js/service-access.js"></script>

   If the protected page is inside a folder, adjust the
   script path and redirect paths according to your structure.

   ============================================================ */

(function () {

    "use strict";


    /* ============================================================
       CONFIGURATION
       ============================================================ */

    /*
     * Minimum number of lesson plans required
     * to access the protected service.
     */
    const MINIMUM_BALANCE = 10;


    /*
     * Netlify balance function.
     */
    const BALANCE_API =
        "/.netlify/functions/get-balance";


    /*
     * Page to send the user to if access is denied.
     *
     * If the protected page and dashboard.html are
     * in the SAME folder:
     *
     *     "dashboard.html"
     *
     * If the protected page is INSIDE a folder:
     *
     *     "../dashboard.html"
     */
    const REDIRECT_PAGE =
        "dashboard.html";


    /*
     * Login page.
     *
     * If this protected page is inside a folder
     * and login.html is one level above:
     *
     *     "../login.html"
     */
    const LOGIN_PAGE =
        "../login.html";


    /* ============================================================
       PREVENT DUPLICATE INITIALIZATION
       ============================================================ */

    if (window.FilaServiceAccessLoaded) {
        return;
    }

    window.FilaServiceAccessLoaded = true;


    /* ============================================================
       CREATE ACCESS MODAL
       ============================================================ */

    function createAccessModal() {

        /*
         * Do not create the modal more than once.
         */
        if (
            document.getElementById(
                "filaServiceAccessModal"
            )
        ) {
            return;
        }


        const modal =
            document.createElement("div");


        modal.id =
            "filaServiceAccessModal";


        /*
         * IMPORTANT:
         * These classes are unique to this service-access system.
         * They do not use your normal .modal class.
         */
        modal.className =
            "fila-service-access-overlay";


        modal.innerHTML = `

            <div
                class="fila-service-access-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="filaServiceAccessTitle"
            >

                <div class="fila-service-access-icon">
                    🔒
                </div>


                <h2 id="filaServiceAccessTitle">
                    Ntimwemerewe iyi Serivisi.
                </h2>


                <p>
                    Mwihangane, Ntabwo mwemerewe gukoresha iyi
                    Serivisi ya
                    <strong>Fila Marks System</strong>.
                </p>


                <p>
                    Iyi ni serivisi yagenewe abantu bashyigikira
                    ibikorwa byacu.

                    Niyo mpamvu kugira ngo uyikoreshe, nibura
                    ugomba kuba ufite
                    <strong>lesson plans 10</strong>
                    kuri balance yawe.

                    Gusa gukoresha iyi system
                    <strong>
                        ntibizatuma lesson plans zawe zivaho.
                    </strong>
                </p>


                <div class="fila-service-access-balance">

                    <span>
                        Balance yanyu:
                    </span>

                    <strong id="filaCurrentLessonBalance">
                        —
                    </strong>

                    <span>
                        lesson plans
                    </span>

                </div>


                <button
                    type="button"
                    id="filaServiceAccessButton"
                    class="fila-service-access-button"
                >
                    Sawa
                </button>

            </div>
        `;


        document.body.appendChild(modal);


        /*
         * Clicking Sawa sends the user back to dashboard.
         */
        const button =
            document.getElementById(
                "filaServiceAccessButton"
            );


        if (button) {

            button.addEventListener(
                "click",
                function () {

                    window.location.href =
                        REDIRECT_PAGE;

                }
            );

        }

    }


    /* ============================================================
       ADD MODAL CSS
       ============================================================ */

    function addStyles() {

        /*
         * Prevent duplicate CSS.
         */
        if (
            document.getElementById(
                "filaServiceAccessStyles"
            )
        ) {
            return;
        }


        const style =
            document.createElement("style");


        style.id =
            "filaServiceAccessStyles";


        style.textContent = `

            /* =================================================
               SERVICE ACCESS OVERLAY
               ================================================= */

            .fila-service-access-overlay {

                position: fixed;

                inset: 0;

                display: none;

                align-items: center;

                justify-content: center;

                padding: 20px;

                background:
                    rgba(15, 23, 42, 0.65);

                backdrop-filter:
                    blur(5px);

                -webkit-backdrop-filter:
                    blur(5px);

                z-index: 999999;

            }


            .fila-service-access-overlay.show {

                display: flex;

            }


            /* =================================================
               MODAL
               ================================================= */

            .fila-service-access-modal {

                width: 100%;

                max-width: 480px;

                box-sizing: border-box;

                background: #ffffff;

                border-radius: 18px;

                padding: 32px;

                text-align: center;

                box-shadow:
                    0 25px 70px
                    rgba(15, 23, 42, 0.30);

                animation:
                    filaServiceAccessPopup
                    0.25s
                    ease-out;

            }


            /* =================================================
               ICON
               ================================================= */

            .fila-service-access-icon {

                width: 64px;

                height: 64px;

                margin:
                    0 auto 18px;

                display: flex;

                align-items: center;

                justify-content: center;

                border-radius: 50%;

                background: #fef3c7;

                font-size: 28px;

                box-sizing: border-box;

            }


            /* =================================================
               TITLE
               ================================================= */

            .fila-service-access-modal h2 {

                margin:
                    0 0 16px;

                color:
                    #1e293b;

                font-size:
                    22px;

                font-weight:
                    700;

            }


            /* =================================================
               TEXT
               ================================================= */

            .fila-service-access-modal p {

                margin:
                    0 0 14px;

                color:
                    #475569;

                font-size:
                    15px;

                line-height:
                    1.7;

            }


            .fila-service-access-modal p strong {

                color:
                    #1e293b;

                font-weight:
                    700;

            }


            /* =================================================
               BALANCE
               ================================================= */

            .fila-service-access-balance {

                margin:
                    22px 0;

                padding:
                    14px 16px;

                border-radius:
                    10px;

                background:
                    #f8fafc;

                color:
                    #64748b;

                font-size:
                    14px;

                line-height:
                    1.5;

            }


            .fila-service-access-balance strong {

                margin:
                    0 4px;

                color:
                    #dc2626;

                font-size:
                    18px;

                font-weight:
                    700;

            }


            /* =================================================
               BUTTON
               ================================================= */

            .fila-service-access-button {

                width:
                    100%;

                border:
                    none;

                border-radius:
                    10px;

                padding:
                    13px 18px;

                background:
                    #1e293b;

                color:
                    #ffffff;

                font-family:
                    inherit;

                font-size:
                    15px;

                font-weight:
                    600;

                cursor:
                    pointer;

                transition:
                    background 0.2s ease,
                    transform 0.2s ease;

            }


            .fila-service-access-button:hover {

                background:
                    #0f172a;

                transform:
                    translateY(-1px);

            }


            .fila-service-access-button:active {

                transform:
                    translateY(0);

            }


            /* =================================================
               ANIMATION
               ================================================= */

            @keyframes filaServiceAccessPopup {

                from {

                    opacity:
                        0;

                    transform:
                        translateY(12px)
                        scale(0.97);

                }


                to {

                    opacity:
                        1;

                    transform:
                        translateY(0)
                        scale(1);

                }

            }


            /* =================================================
               MOBILE
               ================================================= */

            @media (max-width: 600px) {

                .fila-service-access-overlay {

                    padding:
                        15px;

                }


                .fila-service-access-modal {

                    padding:
                        25px 20px;

                    border-radius:
                        16px;

                }


                .fila-service-access-modal h2 {

                    font-size:
                        20px;

                }


                .fila-service-access-modal p {

                    font-size:
                        14px;

                    line-height:
                        1.65;

                }

            }

        `;


        document.head.appendChild(style);

    }


    /* ============================================================
       GET LOGGED-IN USER
       ============================================================ */

    function getUserCredentials() {

        /*
         * Your current application stores authentication
         * information using these localStorage keys.
         */

        const token =
            localStorage.getItem(
                "auth_token"
            );


        const userEmail =
            localStorage.getItem(
                "user_email"
            );


        return {

            token:
                token
                    ? token.trim()
                    : "",

            email:
                userEmail
                    ? userEmail.trim()
                    : ""

        };

    }


    /* ============================================================
       SHOW ACCESS DENIED MODAL
       ============================================================ */

    function showAccessDenied(balance) {

        createAccessModal();


        const modal =
            document.getElementById(
                "filaServiceAccessModal"
            );


        const balanceElement =
            document.getElementById(
                "filaCurrentLessonBalance"
            );


        if (balanceElement) {

            if (
                balance !== null &&
                Number.isFinite(balance)
            ) {

                balanceElement.textContent =
                    balance;

            } else {

                balanceElement.textContent =
                    "—";

            }

        }


        /*
         * Show modal.
         */
        if (modal) {

            modal.classList.add("show");

        }


        /*
         * Prevent scrolling behind modal.
         */
        document.body.style.overflow =
            "hidden";


        /*
         * Prevent Escape from bypassing restriction.
         */
        document.addEventListener(
            "keydown",
            preventEscape,
            true
        );

    }


    /* ============================================================
       PREVENT ESCAPE
       ============================================================ */

    function preventEscape(event) {

        if (
            event.key ===
            "Escape"
        ) {

            event.preventDefault();

            event.stopPropagation();

        }

    }


    /* ============================================================
       CHECK SERVICE ACCESS
       ============================================================ */

    async function checkServiceAccess() {

        /* ========================================================
           GET LOGIN INFORMATION
           ======================================================== */

        const credentials =
            getUserCredentials();


        /* ========================================================
           LOGIN CHECK
           ======================================================== */

        if (
            !credentials.token ||
            !credentials.email
        ) {

            window.location.href =
                LOGIN_PAGE;

            return false;

        }


        try {

            /* ====================================================
               BUILD BALANCE REQUEST
               ==================================================== */

            const params =
                new URLSearchParams();


            /*
             * IMPORTANT:
             *
             * The existing get-balance function expects
             * the user's EMAIL.
             *
             * Do NOT send userId here.
             */
            params.set(
                "email",
                credentials.email
            );


            /* ====================================================
               REQUEST BALANCE
               ==================================================== */

            const response =
                await fetch(
                    `${BALANCE_API}?${params.toString()}`,
                    {
                        method:
                            "GET",

                        credentials:
                            "same-origin",

                        cache:
                            "no-store",

                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            /* ====================================================
               CHECK HTTP RESPONSE
               ==================================================== */

            if (!response.ok) {

                throw new Error(
                    `Balance request failed: ${response.status}`
                );

            }


            /* ====================================================
               READ JSON RESPONSE
               ==================================================== */

            const data =
                await response.json();


            /* ====================================================
               CHECK API SUCCESS
               ==================================================== */

            if (
                data.success !== true
            ) {

                throw new Error(
                    "Balance API did not return success."
                );

            }


            /* ====================================================
               GET LESSON PLAN BALANCE
               ==================================================== */

            const balance =
                Number(
                    data.balance
                ) || 0;


            /* ====================================================
               ACCESS RULE
               ====================================================

               10 or more lesson plans
                    = ALLOWED

               Less than 10
                    = DENIED

               IMPORTANT:
               We intentionally check data.balance only.

               referralBonus is NOT added to the 10-plan
               requirement unless you decide later that it
               should count as lesson-plan balance.
            */

            if (
                balance <
                MINIMUM_BALANCE
            ) {

                showAccessDenied(
                    balance
                );

                return false;

            }


            /* ====================================================
               ACCESS GRANTED
               ==================================================== */

            return true;


        } catch (error) {

            console.error(
                "Fila Marks service access error:",
                error
            );


            /*
             * FAIL CLOSED
             *
             * If balance cannot be verified,
             * do not allow access.
             */

            showAccessDenied(
                null
            );


            return false;

        }

    }


    /* ============================================================
       INITIALIZE
       ============================================================ */

    async function initializeServiceAccess() {

        /*
         * Add CSS first.
         */
        addStyles();


        /*
         * Wait for body if necessary.
         */
        if (!document.body) {

            document.addEventListener(
                "DOMContentLoaded",
                initializeServiceAccess,
                {
                    once:
                        true
                }
            );

            return;

        }


        /*
         * Create modal structure.
         */
        createAccessModal();


        /*
         * Check service access.
         */
        const allowed =
            await checkServiceAccess();


        /*
         * Make result available globally.
         */
        window.filaServiceAccessGranted =
            allowed;


        /*
         * Notify the page.
         */
        document.dispatchEvent(
            new CustomEvent(
                "filaServiceAccessChecked",
                {
                    detail: {
                        allowed:
                            allowed
                    }
                }
            )
        );

    }


    /* ============================================================
       PUBLIC API
       ============================================================ */

    window.FilaServiceAccess = {

        check:
            checkServiceAccess,

        showDenied:
            showAccessDenied,

        minimumBalance:
            MINIMUM_BALANCE

    };


    /* ============================================================
       START
       ============================================================ */

    initializeServiceAccess();


})();
