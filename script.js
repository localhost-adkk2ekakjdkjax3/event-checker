// Global Parent
const table = document.getElementById("ctl00_CPH_rgED_GridData");

// Counter
let totalEvents = 0;
let errorCounts = 0;

// Lists
// Contractors to ignore when no Operative is assigned to the event
const ignoreOperativeFor = ["Humber IT", "Support Services", "GE", "Bio-Medical", "Security", "Bal John", "Central Dispatch", "Mike Orrico", "Clintar", "Todd Haynes", "Yondy Lam", "JCI Fire & Security"];

// Services to ignore when no Operative is assigned to the event
const serviceIgnoreList = ["General Facility"];

// Remarks that will help to ignore errors when no Operative is assigned to regular events
const remarksIgnoreList = ["Jeff", "Duplicate", "Modern Niagara"];

// Main Function to handle all the errors in the events
table.querySelectorAll("tr").forEach((row, index) => {
    // If nothing, no need to flow throw
    if (index == 0) return;

    // If something, fetch all the data
    const cells = row.querySelectorAll("td");

    // Now, we have the element; Let's store the values of each cell
    const event = cells[0].textContent.trim();
    const status = cells[1].textContent.trim();
    const location = cells[2].textContent.trim();
    const service = cells[3].textContent.trim();
    const workType = cells[4].textContent.trim();
    const contractor = cells[5].textContent.trim();
    const operative = cells[6].textContent.trim();
    const instructions = cells[7].textContent.trim();
    const remarks = cells[8].textContent.trim();
    const reportedBy = cells[9].textContent.trim();


    // And at the end, let's see how many totalEvents we have
    totalEvents++;
});

alert(`Hey Man, below are the stats
       Total Events are: ${totalEvents}
       Total Warnings are: ${errorCounts}`)