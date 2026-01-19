// Global Parent
const table = document.getElementById("ctl00_CPH_rgED_GridData");

// Counter
let totalEvents = 0;
let errorCounts = 0;

// Lists
// Contractors to ignore when no Operative is assigned to the event
const ignoreOperativeFor = ["Humber IT", "Support Services", "GE", "Bio-Medical", "Security", "Bal John", "Central Dispatch", "Mike Orrico", "Clintar", "Todd Haynes", "Yondy Lam", "JCI Fire & Security"];

// Services to ignore when no Operative is assigned to the event
const serviceIgnoreList = ["General Facility", "Elevators"];

// Remarks that will help to ignore errors when no Operative is assigned to regular events
const remarksIgnoreList = ["Jeff", "Duplicate", "Modern Niagara"];

// Contractors who are always "Out of Scope"
const outOfScopeContractors = ["Humber IT", "Support Services", "GE", "Bio-Medical", "Security"];

// Main Function to handle all the errors in the events
table.querySelectorAll("tr").forEach((row, index) => {
    // If nothing, no need to flow throw
    if (index == 0) return;

    // If something, fetch all the data
    const cells = row.querySelectorAll("td");

    // Event Elements
    const eventCell = cells[0];
    const statusCell = cells[1];
    const locationCell = cells[2];
    const serviceCell = cells[3];
    const workTypeCell = cells[4];
    const contractorCell = cells[5];
    const operativeCell = cells[6];
    const instructionsCell = cells[7];
    const remarksCell = cells[8];
    const reportedByCell = cells[9];

    // Now, we have the element; Let's store the values of each cell
    const event = eventCell.textContent.trim();
    const status = statusCell.textContent.trim();
    const location = locationCell.textContent.trim();
    const service = serviceCell.textContent.trim();
    const workType = workTypeCell.textContent.trim();
    const contractor = contractorCell.textContent.trim();
    const operative = operativeCell.textContent.trim();
    const instructions = instructionsCell.textContent.trim();
    const remarks = remarksCell.textContent.trim();
    const reportedBy = reportedByCell.textContent.trim();

    // Logic 1: Checking if required cells are empty (Remarks)
    if (
        remarks === "" ||
        remarks === "\u00A0"
    ) { mark(remarksCell, "error"); }

    // Logic 2: Checking the missing operative with the condition (was even required or not)
    else if (
        operative === "\u00A0" ||
        operative === ""
    ) {
        if (
            // Contractor have operative
            !ignoreOperativeFor.includes(contractor) &&
            // Service have operative
            !serviceIgnoreList.includes(service) &&
            // Remarks doesn't satify that operative was informed
            !remarksIgnoreList.some(word => remarks.includes(word))
            // Then it's a Flag
        ) { mark(operativeCell, "error"); }
    }

    // Logic 3: Temperature events
    // 1. Template is Right
    // 2. Instructions Matches with Service
    if (
        service == "Room Too Cold" || 
        service == "Room Too Hot"
    ) {
        // Template is Right
        if (remarks.includes("RDS")) { 
            mark(remarksCell); 
        }
        
        else { mark(remarksCell, "error"); }
    }

    if (
        service == "Room Too Cold" || 
        service == "Room Too Hot"
    ) {
        // Instructions mathces with service
        // Service matches to Instructions
        // Too Cold
        if ( 
            service == "Room Too Cold" && 
            instructions.includes("cold") 
        ) { 
            mark(serviceCell); 
            mark(instructionsCell); 
        }

        // Too Hot
        else if (
            service == "Room Too Hot" &&
            instructions.includes("hot")
        ) {
            mark(serviceCell);
            mark(instructionsCell);
        }

        else { 
            mark(serviceCell, "error");
            mark(instructionsCell, "error");
         }
    }

    // Logic 4: Out of Scope is assigned to right contractors only
    if (
        service === "Out of Scope"
    ) {
        if (
            !outOfScopeContractors.includes(contractor)
        ) {
            mark(serviceCell, "error")
        }
        else if (
            workType !== "Inspect"
        ) {
            mark(workTypeCell, "error");
        }

        else {
            mark(serviceCell);
            mark(contractorCell);
            mark(workTypeCell);
        }
    }

    // Logic 5: Out of Scope Contacts have Out of Scope only
    if (
        outOfScopeContractors.includes(contractor)
    ) {
        if (
            service !== "Out of Scope"
        ) {
            mark(serviceCell, "error")
        }
    }

    // And at the end, let's see how many totalEvents we have
    totalEvents++;
});

// Functions
// Marker for errors or correct values
function mark(element, type="non-error") {
    let color = "green";
    if (type == "error") { color = "red"; errorCounts++ }
    element.style.backgroundColor = color;
    element.style.color = "white";
}

// Showing the important information at the end
alert(`Hey Man, below are the stats
       > Total Events are: ${totalEvents}
       > Total Warnings are: ${errorCounts}`);