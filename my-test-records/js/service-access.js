/* ============================================================
   FILA MARKS SYSTEM
   SERVICE ACCESS CONTROL
   ============================================================

   PURPOSE:
   Restrict selected pages to users who have at least
   10 lesson plans available on their balance.

   HOW TO USE:

   Add this before </body> on any page you want to protect:

       <script src="js/service-access.js"></script>

   Or, if the file is in the same folder:

       <script src="service-access.js"></script>

   IMPORTANT:
   The balance endpoint below must match your actual
   Netlify function URL.

   ============================================================ */

(function () {
    "use strict";

    /* ========================================================
       CONFIGURATION
       ======================================================== */

    const MINIMUM_BALANCE = 10;

    /*
     * Change this if your Netlify function has a different name.
     */
    const BALANCE_API = "/.netlify/functions/get-balance";

    /*
     * Where the user goes after being denied access.
     */
    const REDIRECT_PAGE = "dashboard.html";


    /* ========================================================
       PREVENT DUPLICATE INITIALIZATION
       ======================================================== */

    if (window.FilaServiceAccessLoaded) {
        return;
    }

    window.FilaServiceAccessLoaded = true;


    /* ========================================================
       ADD MODAL HTML
       ======================================================== */

    function createAccessModal() {

        /*
         * Do not create it twice.
         */
        if (document.getElementById("filaServiceAccessModal")) {
            return;
        }

        const modal = document.createElement("div");

        modal.id = "filaServiceAccessModal";
        modal.className = "fila-service-access-overlay";

        modal.innerHTML = `
            <div class="fila-service-access-modal" role="dialog" aria-modal="true">

                <div class="fila-service-access-icon">
                    🔒
                </div>

                <h2>Serivisi Ntiremewe</h2>

                <p>
                    Mwihangane, Ntabwo mwemerewe gukoresha iyi Serivisi Ya
                    <strong>Fila Marks System</strong>.
                </p>

                <p>
                    Iyi ni serivisi yagenewe abantu bashyigikira ibikorwa byacu.
                    Niyo mpamvu kugira ngo uyikoreshe, nibura ugomba kuba ufite
                    <strong>lesson plans 10</strong> kuri balance yawe, Gusa iyi system ntizatuma zivaho.
                </p>

                <div class="fila-service-access-balance">
                    <span>Balance yanyu:</span>
                    <strong id="filaCurrentLessonBalance">0</strong>
                    <span>lesson plans</span>
                </div>

                <button
                    type="button"
                    id="filaServiceAccessButton"
                    class="fila-service-access-button">
                    Sawa
                </button>

            </div>
        `;

        document.body.appendChild(modal);

        /*
         * The user cannot simply close the modal.
         * The button redirects them away from the protected page.
         */
        document
            .getElementById("filaServiceAccessButton")
            .addEventListener("click", function () {
                window.location.href = REDIRECT_PAGE;
            });
    }


    /* ========================================================
       ADD CSS
       ======================================================== */

    function addStyles() {

        /*
         * Prevent duplicate CSS.
         */
        if (document.getElementById("filaServiceAccessStyles")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "filaServiceAccessStyles";

        style.textContent = `

            /* =================================================
               FILA SERVICE ACCESS OVERLAY
               ================================================= */

            .fila-service-access-overlay {
                position: fixed;
                inset: 0;

                display: none;

                align-items: center;
                justify-content: center;

                padding: 20px;

                background: rgba(15, 23, 42, 0.65);

                backdrop-filter: blur(5px);
                -webkit-backdrop-filter: blur(5px);

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
                    0 25px 70px rgba(15, 23, 42, 0.30);

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

                margin: 0 auto 18px;

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
                margin: 0 0 16px;

                color: #1e293b;

                font-size: 22px;
                font-weight: 700;
            }


            /* =================================================
               TEXT
               ================================================= */

            .fila-service-access-modal p {
                margin: 0 0 14px;

                color: #475569;

                font-size: 15px;
                line-height: 1.7;
            }


            .fila-service-access-modal p strong {
                color: #1e293b;
                font-weight: 700;
            }


            /* =================================================
               BALANCE
               ================================================= */

            .fila-service-access-balance {
                margin: 22px 0;

                padding: 14px 16px;

                border-radius: 10px;

                background: #f8fafc;

                color: #64748b;

                font-size: 14px;

                line-height: 1.5;
            }


            .fila-service-access-balance strong {
                margin: 0 4px;

                color: #dc2626;

                font-size: 18px;
                font-weight: 700;
            }


            /* =================================================
               BUTTON
               ================================================= */

            .fila-service-access-button {
                width: 100%;

                border: none;

                border-radius: 10px;

                padding: 13px 18px;

                background: #1e293b;

                color: #ffffff;

                font-family: inherit;

                font-size: 15px;
                font-weight: 600;

                cursor: pointer;

                transition:
                    background 0.2s ease,
                    transform 0.2s ease;
            }


            .fila-service-access-button:hover {
                background: #0f172a;

                transform: translateY(-1px);
            }


            .fila-service-access-button:active {
                transform: translateY(0);
            }


            /* =================================================
               ANIMATION
               ================================================= */

            @keyframes filaServiceAccessPopup {

                from {
                    opacity: 0;

                    transform:
                        translateY(12px)
                        scale(0.97);
                }

                to {
                    opacity: 1;

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
                    padding: 15px;
                }


                .fila-service-access-modal {
                    padding: 25px 20px;

                    border-radius: 16px;
                }


                .fila-service-access-modal h2 {
                    font-size: 20px;
                }


                .fila-service-access-modal p {
                    font-size: 14px;
                    line-height: 1.65;
                }

            }

        `;

        document.head.appendChild(style);
    }


    /* ========================================================
       GET USER IDENTIFICATION
       ======================================================== */

    function getUserCredentials() {

        /*
         * Your existing pages appear to use localStorage
         * for logged-in user information.
         */

        const email = localStorage.getItem("email");
        const phone = localStorage.getItem("phone");

        return {
            email: email ? email.trim() : "",
            phone: phone ? phone.trim() : ""
        };
    }


    /* ========================================================
       SHOW ACCESS DENIED MODAL
       ======================================================== */

    function showAccessDenied(balance) {

        createAccessModal();

        const modal =
            document.getElementById("filaServiceAccessModal");

        const balanceElement =
            document.getElementById("filaCurrentLessonBalance");

        if (balanceElement) {
            balanceElement.textContent =
                Number.isFinite(balance)
                    ? balance
                    : "—";
        }

        /*
         * Show the modal.
         */
        modal.classList.add("show");


        /*
         * Prevent scrolling behind the modal.
         */
        document.body.style.overflow = "hidden";


        /*
         * Prevent keyboard escape from bypassing the restriction.
         */
        document.addEventListener(
            "keydown",
            preventEscape,
            true
        );
    }


    /* ========================================================
       PREVENT ESCAPE
       ======================================================== */

    function preventEscape(event) {

        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
        }
    }


    /* ========================================================
       CHECK BALANCE
       ======================================================== */

    async function checkServiceAccess() {

        const credentials = getUserCredentials();

        /*
         * User is not logged in.
         */
        if (!credentials.email && !credentials.phone) {

            window.location.href = "../login.html";

            return false;
        }


        try {

            const params = new URLSearchParams();


            /*
             * Prefer email when available.
             */
            if (credentials.email) {

                params.set(
                    "email",
                    credentials.email
                );

            } else {

                params.set(
                    "phone",
                    credentials.phone
                );

            }


            const response = await fetch(
                `${BALANCE_API}?${params.toString()}`,
                {
                    method: "GET",
                    credentials: "same-origin",
                    cache: "no-store"
                }
            );


            if (!response.ok) {

                throw new Error(
                    `Balance request failed: ${response.status}`
                );
            }


            const data = await response.json();


            /*
             * Make sure the API actually succeeded.
             */
            if (data.success !== true) {

                throw new Error(
                    "Balance API did not return success."
                );
            }


            const balance =
                Number(data.balance) || 0;


            /*
             * MAIN ACCESS RULE
             *
             * 10 or more = allowed
             * Less than 10 = denied
             */

            if (balance < MINIMUM_BALANCE) {

                showAccessDenied(balance);

                return false;
            }


            /*
             * User has enough lesson plans.
             */
            return true;


        } catch (error) {

            console.error(
                "Fila Marks service access error:",
                error
            );


            /*
             * FAIL CLOSED
             *
             * If we cannot verify the user's balance,
             * do not allow access.
             */

            showAccessDenied(null);

            return false;
        }
    }


    /* ========================================================
       INITIALIZE
       ======================================================== */

    async function initializeServiceAccess() {

        /*
         * Add the CSS immediately.
         */
        addStyles();


        /*
         * Wait until body exists.
         */
        if (!document.body) {

            document.addEventListener(
                "DOMContentLoaded",
                initializeServiceAccess,
                { once: true }
            );

            return;
        }


        /*
         * Create the modal before checking.
         */
        createAccessModal();


        /*
         * Check the user's balance.
         */
        const allowed =
            await checkServiceAccess();


        /*
         * Tell the page whether access is allowed.
         *
         * This is useful if another script wants
         * to know the result.
         */

        window.filaServiceAccessGranted =
            allowed;


        /*
         * Fire a custom event.
         *
         * Example:
         *
         * document.addEventListener(
         *     "filaServiceAccessGranted",
         *     function () {
         *         // page initialization
         *     }
         * );
         */

        document.dispatchEvent(
            new CustomEvent(
                "filaServiceAccessChecked",
                {
                    detail: {
                        allowed: allowed
                    }
                }
            )
        );
    }


    /* ========================================================
       PUBLIC FUNCTIONS
       ======================================================== */

    window.FilaServiceAccess = {

        check: checkServiceAccess,

        showDenied: showAccessDenied,

        minimumBalance: MINIMUM_BALANCE

    };


    /* ========================================================
       START
       ======================================================== */

    initializeServiceAccess();

})();
