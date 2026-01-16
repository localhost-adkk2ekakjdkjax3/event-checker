table.querySelectorAll("tr").forEach((row, index) => {
  totalEvents++;


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