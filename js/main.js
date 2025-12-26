document.addEventListener("DOMContentLoaded", () => {

    /* ===============================
       RETRIEVE SELECTION & FORCE SELECTION FIRST
    ================================ */
    const level = localStorage.getItem("level");
    const classLevel = localStorage.getItem("classLevel");
    const subject = localStorage.getItem("subject");
    const unit = localStorage.getItem("unit");

    if (!level || !classLevel || !subject || !unit) {
        window.location.replace("selection.html");
        return; // stop further execution
    }

    /* ===============================
       DOM ELEMENTS
    ================================ */
    const outputArea = document.getElementById("outputArea");
    const input = document.getElementById("noteInput");
    const sendBtn = document.getElementById("sendBtn");
    const copyBtn = document.getElementById("copyBtn");
    const saveBtn = document.getElementById("saveBtn");
    const editBtn = document.getElementById("editBtn");
    const changeBtn = document.getElementById("changeSelectionBtn");

    const currentSelectionEl = document.getElementById("currentSelection");
    if (currentSelectionEl) {
        currentSelectionEl.textContent = `${level} | ${classLevel} | ${subject} | ${unit}`;
    }

    /* ===============================
       CHANGE SELECTION ICON
    ================================ */
    changeBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "selection.html";
    });

    /* ===============================
       NOTES DATABASE MAPPING
    ================================ */
    let notesDatabase = {};

    const notesFileMap = {
        "Primary": {
            "P1": {
                "English": {
                    "Unit 1: Welcome to the Classroom": "primary/p1/english/welcometoschool.html",
                    "Unit 2: Classroom Objects": "primary/p1/english/classroomobjects.json",
                    "Unit 3: People at Home and School": "primary/p1/english/peopleathome.json",
                    "Unit 4: Clothes and Body Parts": "primary/p1/english/clothesandbodyparts.json",
                    "Unit 5: Likes and Dislikes": "primary/p1/english/likesanddislikes.json",
                    "Unit 6: Classroom Objects and Personal Belongings": "primary/p1/english/classroomobjectsandbelongings.json",
                    "Unit 7: Home": "primary/p1/english/home.json",
                    "Unit 8: Domestic Animals": "primary/p1/english/domesticanimals.json",
                    "Unit 9: Daily Routine": "primary/p1/english/dailyroutine.json",
                    "Unit 10: Story Telling": "primary/p1/english/storytelling.json"
                }
            },
            "P2": {
                "English": {
                    "Unit 1: Greetings, Introductions and Talking about School": "primary/p2/english/greetings.json",
                    "Unit 2: Sports": "primary/p2/english/sports.json",
                    "Unit 3: Telling the Time": "primary/p2/english/tellingthetime.json",
                    "Unit 4: Food Stuffs": "primary/p2/english/foodstuffs.json",
                    "Unit 5: Stories and Descriptions": "primary/p2/english/storiesanddescriptions.json",
                    "Unit 6: Family Members and Household Activities": "primary/p2/english/familyactivities.json",
                    "Unit 7: Weather": "primary/p2/english/weather.json",
                    "Unit 8: The Zoo (Animals)": "primary/p2/english/zooanimals.json",
                    "Unit 9: Counting and Writing": "primary/p2/english/countingandwriting.json",
                    "Unit 10: Past and Future Events": "primary/p2/english/pastandfuture.json"
                }
            },
            "P3": {
                "English": {
                    "Unit 1: Places in the Community": "primary/p3/english/placesincommunity.json",
                    "Unit 2: People and Jobs in the Community": "primary/p3/english/peopleandjobs.json",
                    "Unit 3: Time": "primary/p3/english/time.json",
                    "Unit 4: Events in the Past and Future": "primary/p3/english/pastandfutureevents.json",
                    "Unit 5: Domestic Animals": "primary/p3/english/domesticanimals.json",
                    "Unit 6: The Body and Health": "primary/p3/english/bodyandhealth.json",
                    "Unit 7: Clothes": "primary/p3/english/clothes.json",
                    "Unit 8: Rwanda": "primary/p3/english/rwanda.json",
                    "Unit 9: Calculations and Using Graphs": "primary/p3/english/calculationsandgraphs.json",
                    "Unit 10: Shopping": "primary/p3/english/shopping.json"
                }
            },
            "P4": {
                "English": {
                    "Unit 1: Our School": "primary/p4/english/ourschool.json",
                    "Unit 2: My Friends and I": "primary/p4/english/myfriends.json",
                    "Unit 3: Our District": "primary/p4/english/ourdistrict.json",
                    "Unit 4: Weather": "primary/p4/english/weather.json",
                    "Unit 5: Jobs and Roles in Home and Community": "primary/p4/english/jobsandroles.json",
                    "Unit 6: Wild Animals": "primary/p4/english/wildanimals.json",
                    "Unit 7: Rights, Responsibilities and Needs": "primary/p4/english/rights.json",
                    "Unit 8: Talking about the Past": "primary/p4/english/talkingpast.json",
                    "Unit 9: Countries, Rivers and Famous Architectural Structures of the World": "primary/p4/english/countriesriversstructures.json",
                    "Unit 10: Climate Change": "primary/p4/english/climatechange.json"
                }
            },
            "P5": {
                "English": {
                    "Unit 1: Past and Future Events": "primary/p5/english/pastandfuture.json",
                    "Unit 2: The Language of Study Subjects": "primary/p5/english/languageofstudysubjects.json",
                    "Unit 3: Reading": "primary/p5/english/reading.json",
                    "Unit 4: The Environment": "primary/p5/english/environment.json",
                    "Unit 5: Measurement": "primary/p5/english/measurement.json",
                    "Unit 6: Transport": "primary/p5/english/transport.json",
                    "Unit 7: Hygiene and Health": "primary/p5/english/hygieneandhealth.json",
                    "Unit 8: Crafts in Rwanda": "primary/p5/english/crafts.json",
                    "Unit 9: Traditional and Modern Agriculture in Rwanda": "primary/p5/english/agriculture.json",
                    "Unit 10: Geography of the World": "primary/p5/english/geography.json"
                }
            },
            "P6": {
                "English": {
                    "Unit 1: Leisure and Sports": "primary/p6/english/leisureandsports.json",
                    "Unit 2: Making Future Plans": "primary/p6/english/makingfutureplans.json",
                    "Unit 3: Weather": "primary/p6/english/weather.json",
                    "Unit 4: Behaviour, Rules and Laws": "primary/p6/english/behaviourruleslaws.json",
                    "Unit 5: Family Relationships": "primary/p6/english/familyrelationships.json",
                    "Unit 6: Reading Books, Writing Compositions and Examinations": "primary/p6/english/readingwritingexams.json",
                    "Unit 7: Animals": "primary/p6/english/animals.json",
                    "Unit 8: Environment": "primary/p6/english/environment.json",
                    "Unit 9: Maintaining Harmony in the Family": "primary/p6/english/harmony.json",
                    "Unit 10: The Solar System": "primary/p6/english/solarsystem.json"
                }
            }
        },
        "Ordinary": {
            "S1": {
                "English": {
                    "Unit 1: My Secondary School": "ordinary/s1/english/mysecondaryschool.json",
                    "Unit 2: Food and Nutrition": "ordinary/s1/english/foodandnutrition.json",
                    "Unit 3: Holiday Activities": "ordinary/s1/english/holidayactivities.json",
                    "Unit 4: Clothes and Fashion": "ordinary/s1/english/clothesandfashion.json",
                    "Unit 5: Books and School Work Habits": "ordinary/s1/english/booksschoolwork.json",
                    "Unit 6: Healthy Living": "ordinary/s1/english/healthyliving.json",
                    "Unit 7: History of Rwanda": "ordinary/s1/english/historyofrwanda.json",
                    "Unit 8: The Physical Environment": "ordinary/s1/english/physicalenvironment.json",
                    "Unit 9: Anti‑social Behaviour": "ordinary/s1/english/antisocial.json",
                    "Unit 10: Sources of Wealth": "ordinary/s1/english/sourcesofwealth.json"
                }
            },
            "S2": {
                "English": {
                    "Unit 1: TBD": "ordinary/s2/english/unit1.json",
                    "Unit 2: TBD": "ordinary/s2/english/unit2.json"
                }
            },
            "S3": {
                "English": {
                    "Unit 1: TBD": "ordinary/s3/english/unit1.json",
                    "Unit 2: TBD": "ordinary/s3/english/unit2.json"
                }
            }
        }
    };

    /* ===============================
       FETCH NOTES BASED ON SELECTION
    ================================ */
    const unitFilePath = notesFileMap[level]?.[classLevel]?.[subject]?.[unit];  

if (unitFilePath) {  
    fetch(`https://raw.githubusercontent.com/Fils25git/Notes-Generation/main/${unitFilePath}`)  
        .then(res => res.text())  // fetch as HTML/text
        .then(html => {
            const div = document.createElement("div");
            div.className = "bubble system"; // keep your chat style
            div.innerHTML = html;             // insert the HTML content
            outputArea.appendChild(div);
            scrollDown();
        })
        .catch(() => systemBubble("Notes not found for this unit."));  
} else {  
    systemBubble("Notes not found for this unit.");  
}


    /* ===============================
       CHAT BUBBLES
    ================================ */
    function userBubble(text) {
        const div = document.createElement("div");
        div.className = "bubble user";
        div.textContent = text;
        outputArea.appendChild(div);
        scrollDown();
    }

    function systemBubble(text) {
        const div = document.createElement("div");
        div.className = "bubble system";
        outputArea.appendChild(div);
        wordByWord(div, text);
    }

    function scrollDown() {
        outputArea.scrollTop = outputArea.scrollHeight;
    }
    /* ===============================
   WARNING BUBBLE
=============================== */
function warningBubble(text) {
    const div = document.createElement("div");
    div.className = "bubble warning";  // New CSS class for warning
    div.textContent = text;
    outputArea.appendChild(div);
    scrollDown();
}

    /* ===============================
       WORD-BY-WORD EFFECT
    ================================ */
    async function wordByWord(element, text) {
        const words = text.split(" ");
        for (let word of words) {
            element.textContent += word + " ";
            scrollDown();
            await new Promise(r => setTimeout(r, 50));
        }
    }

    /* ===============================
       SEARCH NOTES WITH FUSE.JS
    ================================ */
    function searchNotes(query) {
    const bubbles = [...document.querySelectorAll(".bubble.system")];
    let results = "";

    bubbles.forEach(bubble => {
        const container = document.createElement("div");
        container.innerHTML = bubble.innerHTML;

        const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");

        for (let i = 0; i < headings.length; i++) {
            const heading = headings[i];

            if (heading.textContent.toLowerCase().includes(query.toLowerCase())) {
                // Step 1: Collect parent headings above it
                let headingStack = [];
                let currentLevel = parseInt(heading.tagName.substring(1));

                for (let j = i - 1; j >= 0; j--) {
                    const prev = headings[j];
                    const prevLevel = parseInt(prev.tagName.substring(1));
                    if (prevLevel < currentLevel) {
                        headingStack.unshift(prev.outerHTML); // add parent heading
                        currentLevel = prevLevel;
                    }
                }

                // Step 2: Add the matched heading itself
                headingStack.push(heading.outerHTML);

                // Step 3: Add all content until next heading of same or higher level
                let contentHTML = "";
                let sibling = heading.nextElementSibling;
                const matchLevel = parseInt(heading.tagName.substring(1));

                while (sibling) {
                    if (sibling.tagName && sibling.tagName.match(/^H[1-6]$/)) {
                        let siblingLevel = parseInt(sibling.tagName.substring(1));
                        if (siblingLevel <= matchLevel) break; // stop at same or higher
                    }
                    contentHTML += sibling.outerHTML;
                    sibling = sibling.nextElementSibling;
                }

                results += headingStack.join("\n") + contentHTML;
                break; // only first match per bubble
            }
        }
    });

    return results || null;
            }
    /* ===============================
       SEND MESSAGE
    ================================ */
    function sendMessage() {
    const text = input.value.trim();
    if (!text) {
        warningBubble("⚠ Please type in a Lesson title first!");
        return;
    }

    userBubble(text);

    const response = searchNotes(text);
    if (response) {
        const div = document.createElement("div");
        div.className = "bubble system";
        div.innerHTML = response; // headings + content under matched heading
        outputArea.appendChild(div);
        scrollDown();
    } else {
        systemBubble("No notes found for this heading.");
    }

    input.value = "";
    input.focus();
        }

    /* ===============================
       SAVE AS WORD
    ================================ */
    saveBtn.addEventListener("click", () => {
        const { Document, Packer, Paragraph } = window.docx;

        const allText = [...document.querySelectorAll(".bubble")]
            .map(d => d.textContent);

        if (!allText.length) return alert("No notes to save!");

        const doc = new Document({
            sections: [{
                children: allText.map(line => new Paragraph({ text: line }))
            }]
        });

        Packer.toBlob(doc).then(blob => saveAs(blob, "Notes.docx"));
    });

    /* ===============================
       EDIT MODE
    ================================ */
    editBtn.addEventListener("click", () => {
        document.querySelectorAll(".system").forEach(n => {
            n.contentEditable = n.contentEditable !== "true";
            n.style.border = n.contentEditable === "true" ? "1px dashed #00AF00" : "none";
        });
    });

});
