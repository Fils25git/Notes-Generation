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
    subjectSelect.disabled = false;

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

// Enable Unit select after subject selected
subjectSelect.addEventListener("change", ()=>{
    unitSelect.disabled = false;
    unitSelect.innerHTML = '<option value="">--Select Unit--</option>';
    // Add example units; replace with all your real units
    ["Unit 1: Greetings","Unit 2: Family","Unit 3: Numbers"].forEach(u=>{
        const opt = document.createElement("option");
        opt.value = u; opt.textContent = u;
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
    localStorage.setItem("class", classSelect.value);
    localStorage.setItem("subject", subjectSelect.value);
    localStorage.setItem("unit", unitSelect.value);
    window.location.href = "index.html";
});
