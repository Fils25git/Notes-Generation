const levelSelect = document.getElementById("level");
const classSelect = document.getElementById("classSelect");
const subjectSelect = document.getElementById("subject");
const unitSelect = document.getElementById("unit");
const startBtn = document.getElementById("startBtn");

// Populate Class based on Level
levelSelect.addEventListener("change", () => {
    classSelect.innerHTML = '<option value="">--Select Class--</option>';
    unitSelect.innerHTML = '<option value="">--Select Unit--</option>';
    unitSelect.disabled = true;
    subjectSelect.disabled = true;

    if(levelSelect.value === "Primary"){
        ["P1","P2","P3","P4","P5","P6"].forEach(c=>{
            const opt = document.createElement("option");
            opt.value = c; opt.textContent = c;
            classSelect.appendChild(opt);
        });
    } else if(levelSelect.value === "Ordinary"){
        ["S1","S2","S3"].forEach(c=>{
            const opt = document.createElement("option");
            opt.value = c; opt.textContent = c;
            classSelect.appendChild(opt);
        });
    }
    classSelect.disabled = false;
});

// Enable Subject only after Class selected
classSelect.addEventListener("change", () => {
    subjectSelect.disabled = false;
});

// Populate Units based on Class & Subject
subjectSelect.addEventListener("change", ()=>{
    unitSelect.disabled = false;
    unitSelect.innerHTML = '<option value="">--Select Unit--</option>';

    let units = [];

    if(levelSelect.value === "Primary") {
        switch(classSelect.value) {
            case "P1":
                units = [
                    "Unit 1: Welcome to the Classroom",
                    "Unit 2: Classroom Objects",
                    "Unit 3: People at Home and School",
                    "Unit 4: Clothes and Body Parts",
                    "Unit 5: Likes and Dislikes",
                    "Unit 6: Classroom Objects and Personal Belongings",
                    "Unit 7: Home",
                    "Unit 8: Domestic Animals",
                    "Unit 9: Daily Routine",
                    "Unit 10: Story Telling"
                ];
                break;
            case "P2":
                units = [
                    "Unit 1: Greetings, Introductions and Talking about School",
                    "Unit 2: Sports",
                    "Unit 3: Telling the Time",
                    "Unit 4: Food Stuffs",
                    "Unit 5: Stories and Descriptions",
                    "Unit 6: Family Members and Household Activities",
                    "Unit 7: Weather",
                    "Unit 8: The Zoo (Animals)",
                    "Unit 9: Counting and Writing",
                    "Unit 10: Past and Future Events"
                ];
                break;
            case "P3":
                units = [
                    "Unit 1: Places in the Community",
                    "Unit 2: People and Jobs in the Community",
                    "Unit 3: Time",
                    "Unit 4: Events in the Past and Future",
                    "Unit 5: Domestic Animals",
                    "Unit 6: The Body and Health",
                    "Unit 7: Clothes",
                    "Unit 8: Rwanda",
                    "Unit 9: Calculations and Using Graphs",
                    "Unit 10: Shopping"
                ];
                break;
            case "P4":
                units = [
                    "Unit 1: Our School",
                    "Unit 2: My Friends and I",
                    "Unit 3: Our District",
                    "Unit 4: Weather",
                    "Unit 5: Jobs and Roles in Home and Community",
                    "Unit 6: Wild Animals",
                    "Unit 7: Rights, Responsibilities and Needs",
                    "Unit 8: Talking about the Past",
                    "Unit 9: Countries, Rivers and Famous Architectural Structures of the World",
                    "Unit 10: Climate Change"
                ];
                break;
            case "P5":
                units = [
                    "Unit 1: Past and Future Events",
                    "Unit 2: The Language of Study Subjects",
                    "Unit 3: Reading",
                    "Unit 4: The Environment",
                    "Unit 5: Measurement",
                    "Unit 6: Transport",
                    "Unit 7: Hygiene and Health",
                    "Unit 8: Crafts in Rwanda",
                    "Unit 9: Traditional and Modern Agriculture in Rwanda",
                    "Unit 10: Geography of the World"
                ];
                break;
            case "P6":
                units = [
                    "Unit 1: Leisure and Sports",
                    "Unit 2: Making Future Plans",
                    "Unit 3: Weather",
                    "Unit 4: Behaviour, Rules and Laws",
                    "Unit 5: Family Relationships",
                    "Unit 6: Reading Books, Writing Compositions and Examinations",
                    "Unit 7: Animals",
                    "Unit 8: Environment",
                    "Unit 9: Maintaining Harmony in the Family",
                    "Unit 10: The Solar System"
                ];
                break;
        }
    } else if(levelSelect.value === "Ordinary") {
        switch(classSelect.value) {
            case "S1":
                units = [
                    "Unit 1: My Secondary School",
                    "Unit 2: Food and Nutrition",
                    "Unit 3: Holiday Activities",
                    "Unit 4: Clothes and Fashion",
                    "Unit 5: Books and School Work Habits",
                    "Unit 6: Healthy Living",
                    "Unit 7: History of Rwanda",
                    "Unit 8: The Physical Environment",
                    "Unit 9: Anti‑social Behaviour",
                    "Unit 10: Sources of Wealth"
                ];
                break;
            case "S2":
                units = [
                    "Unit 1: TBD",
                    "Unit 2: TBD",
                    "Unit 3: TBD",
                    "Unit 4: TBD",
                    "Unit 5: TBD",
                    "Unit 6: TBD",
                    "Unit 7: TBD",
                    "Unit 8: TBD",
                    "Unit 9: TBD",
                    "Unit 10: TBD"
                ];
                break;
            case "S3":
                units = [
                    "Unit 1: TBD",
                    "Unit 2: TBD",
                    "Unit 3: TBD",
                    "Unit 4: TBD",
                    "Unit 5: TBD",
                    "Unit 6: TBD",
                    "Unit 7: TBD",
                    "Unit 8: TBD",
                    "Unit 9: TBD",
                    "Unit 10: TBD"
                ];
                break;
        }
    }

    units.forEach(u => {
        const opt = document.createElement("option");
        opt.value = u;
        opt.textContent = u;
        unitSelect.appendChild(opt);
    });
});

// Enable Start button if all selected
[levelSelect,classSelect,subjectSelect,unitSelect].forEach(select=>{
    select.addEventListener("change", ()=>{
        startBtn.disabled = !(levelSelect.value && classSelect.value && subjectSelect.value && unitSelect.value);
    });
});

startBtn.addEventListener("click", ()=>{
    localStorage.setItem("level", levelSelect.value);
    localStorage.setItem("classLevel", classSelect.value);
    localStorage.setItem("subject", subjectSelect.value);
    localStorage.setItem("unit", unitSelect.value);
    localStorage.setItem("selectionDone", "true");
    window.location.href = "index.html";
});
