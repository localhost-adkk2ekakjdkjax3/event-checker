const table = document.getElementById("ctl00_CPH_rgED_GridData");
let counts = 0;
let totalEvents = -1;

table.querySelectorAll("tr").forEach((tr, index) => {
  totalEvents++;
  if (index === 0) return; 

  const contractorIgnoreList = ["Humber IT", "Support Services", "GE", "Bio-Medical", "Security", "Bal John", "Central Dispatch", "Mike Orrico", "Clintar", "Todd Haynes", "Yondy Lam", "JCI Fire & Security"];
  const serviceIgnoreList = ["Elevators", "General Facility"];
  const remarksIgnoreList = ["Jeff", "Duplicate", "Modern Niagara"];

  
  const allTds = tr.querySelectorAll("td");
  
  const tdEventID = allTds[0];
  const tdStatus = allTds[1];
  const tdLocation = allTds[2];
  const tdService = allTds[3]; // Event Name
  const tdWorkType = allTds[4];
  const tdContractor = allTds[5];
  const tdOperative = allTds[6]; 
  const tdInstructions = allTds[7];
  const tdRemarks = allTds[8];
  const tdReportedBy = allTds[9];

  const serviceName = tdService.textContent.trim();
  const contractorName = tdContractor.textContent.trim();
  const operativeValue = tdOperative.textContent.trim();
  const remarksValue = tdRemarks.textContent.trim();
  console.log(remarksValue);

  // Logic to check if the event wasn't assigned to anyone (If Operative was compalsary)
  if (operativeValue === "\u00A0" || operativeValue === "") {
    if (!contractorIgnoreList.includes(contractorName)) { 
      if (!serviceIgnoreList.includes(serviceName)) {
        if (!remarksIgnoreList.some(word => remarksValue.includes(word))) {
          tdOperative.style.backgroundColor = "red";
          counts++;
        }
      }
    }
  }

  // Logic to check if the remarks are not missing at all
  if (tdRemarks.querySelector('div').querySelector('div').textContent === "\u00A0") {
    tdRemarks.style.backgroundColor = "red";
    counts++;
  }

  // Logic to check that right Template was used for Temperature event
  if (serviceName == "Room Too Cold" || serviceName == "Room Too Hot") {
    if (remarksValue.includes("RDS")) {
      tdRemarks.style.backgroundColor = "green";
      tdRemarks.style.color = "white";
    }
    else {
      tdRemarks.style.backgroundColor = "red";
      counts++;
    }
  }
});

alert(`Total Events are: ${totalEvents}\nTotal Warnings are: ${counts}`);