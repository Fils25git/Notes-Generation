async function generateCV(){

const form = document.getElementById("cvForm");
const formData = new FormData(form);

// language from selector
const lang = document.getElementById("cvLanguage").value || "english";

// load template
const response = await fetch(`./templates/${lang}/cv-template.html`);

console.log("Fetch status:", response.status);

if (!response.ok) {
    alert("Template NOT found → " + response.status);
    return;
}

let template = await response.text();
console.log("Template loaded:", template.substring(0, 200));

// BASIC DATA
const fullName = formData.get("fullName");
const email = formData.get("email");
const phone = formData.get("phone");
const place = formData.get("placeOfLiving");
const dob = formData.get("dob");
const marital = formData.get("maritalStatus");
const father = formData.get("fatherName");
const mother = formData.get("motherName");
const idNumber = formData.get("idNumber");
const skills = formData.get("skills");

const date = new Date().toLocaleDateString();


// replace placeholders
template = template
.replaceAll("{{fullName}}", fullName)
.replaceAll("{{email}}", email)
.replaceAll("{{phone}}", phone)
.replaceAll("{{placeOfLiving}}", place)
.replaceAll("{{dob}}", dob)
.replaceAll("{{maritalStatus}}", marital)
.replaceAll("{{fatherName}}", father)
.replaceAll("{{motherName}}", mother)
.replaceAll("{{idNumber}}", idNumber)
.replaceAll("{{computerSkills}}", skills)
.replaceAll("{{date}}", date);


// EDUCATION
const primarySchools = formData.getAll("primaryInstitution[]");
const primaryStart = formData.getAll("primaryStart[]");
const primaryEnd = formData.getAll("primaryEnd[]");

const secondarySchools = formData.getAll("secondaryInstitution[]");
const secondaryStart = formData.getAll("secondaryStart[]");
const secondaryEnd = formData.getAll("secondaryEnd[]");
const secondaryComb = formData.getAll("secondaryCombination[]");

const universitySchools = formData.getAll("universityInstitution[]");
const universityStart = formData.getAll("universityStart[]");
const universityEnd = formData.getAll("universityEnd[]");
const universityComb = formData.getAll("universityCombination[]");

let educationHTML = "";

primarySchools.forEach((s,i)=>{
educationHTML += `<li>${primaryStart[i]} - ${primaryEnd[i]} : ${s}</li>`;
});

secondarySchools.forEach((s,i)=>{
educationHTML += `<li>${secondaryStart[i]} - ${secondaryEnd[i]} : ${s} (${secondaryComb[i]})</li>`;
});

universitySchools.forEach((s,i)=>{
educationHTML += `<li>${universityStart[i]} - ${universityEnd[i]} : ${s} (${universityComb[i]})</li>`;
});

template = template.replace(
'<ul id="educationList"><li>{{education}}</li></ul>',
`<ul id="educationList">${educationHTML}</ul>`
);


// LANGUAGES
const languages = formData.getAll("languageName[]");
const fluency = formData.getAll("fluency[]");

let langRows = "";

languages.forEach((l,i)=>{
langRows += `
<tr>
<td>${i+1}</td>
<td>${l}</td>
<td>${fluency[i]}</td>
</tr>`;
});

template = template.replace(
'<tbody id="languageTable"><tr><td>{{langNo}}</td><td>{{language}}</td><td>{{level}}</td></tr></tbody>',
`<tbody id="languageTable">${langRows}</tbody>`
);


// EXPERIENCE
const companies = formData.getAll("company[]");
const startDates = formData.getAll("startDate[]");
const endDates = formData.getAll("endDate[]");
const positions = formData.getAll("position[]");

let expHTML = "";

companies.forEach((c,i)=>{
expHTML += `<li><b>${c}</b> (${startDates[i]} - ${endDates[i]}) - ${positions[i]}</li>`;
});

template = template.replace(
'<ul id="experienceList"><li>{{experience}}</li></ul>',
`<ul id="experienceList">${expHTML}</ul>`
);


// HOBBIES
const hobbies = formData.getAll("hobbies[]");

let hobbyHTML = "";

hobbies.forEach(h=>{
hobbyHTML += `<li>${h}</li>`;
});

template = template.replace(
'<ol id="hobbyList"><li>{{hobby}}</li></ol>',
`<ol id="hobbyList">${hobbyHTML}</ol>`
);


// REFERENCES
const refNames = formData.getAll("refName[]");
const refPhones = formData.getAll("refPhone[]");
const refEmails = formData.getAll("refEmail[]");

let refRows = "";

refNames.forEach((n,i)=>{
refRows += `
<tr>
<td>${n}</td>
<td>${refPhones[i]}</td>
<td>${refEmails[i]}</td>
</tr>`;
});

template = template.replace(
'<tbody id="referenceTable"><tr><td>{{refName}}</td><td>{{refTitle}}</td><td>{{refPhone}}</td></tr></tbody>',
`<tbody id="referenceTable">${refRows}</tbody>`
);


// SHOW RESULT
document.getElementById("cvContent").innerHTML = template;

document.getElementById("cvForm").style.display = "none";
document.getElementById("resultContainer").style.display = "block";

document.getElementById("resultContainer").scrollIntoView({behavior:"smooth"});
}
