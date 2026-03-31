// Global Parent
const table = document.getElementById("ctl00_CPH_rgED_GridData");

// Counter
let totalEvents = 0;
let errorCounts = 0;
let warningCounts = 0;

// Lists
// Contractors to ignore when no Operative is assigned to the event
const ignoreOperativeFor = ["Humber IT", "Support Services", "GE", "Bio-Medical", "Security", "Bal John", "Central Dispatch", "Mike Orrico", "Clintar", "Todd Haynes", "Yondy Lam", "JCI Fire & Security"];

// Services to ignore when no Operative is assigned to the event
const serviceIgnoreList = ["General Facility", "Elevators"];

// Remarks that will help to ignore errors when no Operative is assigned to regular events
const remarksIgnoreList = ["Jeff", "Duplicate", "Modern Niagara"];

// Contractors who are always "Out of Scope"
const outOfScopeContractors = ["Humber IT", "Support Services", "GE", "Bio-Medical", "Security"];

// Dictionary/Object to map the regular and most common services
const eventMapper = {
    // UAF
    "Toilet Blocked": "Urgent AF",
    "Elevators": "Urgent AF",
    
    // USF
    "Nurse Call": "Urgent SF",
    "Fridge/Freezer": "Urgent SF",
    "Sterilizers": "Urgent SF",
    "Pneumatic Tube": "Urgent SF",
    "Patient Wandering": "Urgent SF",
    "Code Brown, Hazmat": "Urgent SF",
    
    // RSF
    "Office Furniture (Desks, Chairs, Tables, Cabinet)": "Routine SF",
    "Room Too Hot": "Routine SF",
    "Room Too Hot": "Routine SF",
    "Bed Management": "Routine SF",
    "Medical Chairs (Geri, Bariatric, Commodes)": "Routine SF",
    "Int. Repair Other": "Routine SF",
    "Wheelchairs/Walkers": "Routine SF",
    "Patient Room/Lounge Furniture": "Routine SF",
    
    // Others
    "Out of Scope": "Inspect",
    "Keys": "General Facility Service",
}

// Factory method to create the fields for row table
const createField = (cell) => ({
  cell,
  data: cell?.textContent.trim() || "",
  error: false
});


// Main Function to handle all the errors in the events
table.querySelectorAll("tr").forEach((row, index) => {
    // If nothing, no need to flow throw
    if (index == 0) return;

    // If something, fetch all the data
    const cells = row.querySelectorAll("td");

    const fields = {
        event: createField(cells[0]),
        status: createField(cells[1]),
        location: createField(cells[2]),
        service: createField(cells[3]),
        workType: createField(cells[4]),
        contractor: createField(cells[5]),
        operative: createField(cells[6]),
        instructions: createField(cells[7]),
        remarks: createField(cells[8]),
        reportedBy: createField(cells[9])
    }; 

    // Logic 1: Checking if required cells are empty (Remarks)
    if (
        remarks === "" ||
        remarks === "\u00A0"
    ) { 
        mark(remarksCell, "error", true); 
        remarksError = true;
    }

    // Logic 2: Checking the missing operative with the condition (was even required or not)
    if (
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
        ) { mark(operativeCell, "error", true); }
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
        
        else { mark(remarksCell, "error", true); }
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
            mark(serviceCell, "error", true);
            mark(instructionsCell, "error");
         }
    }

    // Logic 4: Out of Scope is assigned to right contractors only
    if (service === "Out of Scope") {
        if (!outOfScopeContractors.includes(contractor)) {
            mark(serviceCell, "error", true)
        }

        else {
            mark(serviceCell);
            mark(contractorCell);
            mark(workTypeCell);
        }
    }

    // Logic 5: Out of Scope Contacts have Out of Scope only
    if (outOfScopeContractors.includes(contractor)) {
        if (service !== "Out of Scope") {
            mark(serviceCell, "error", true)
        }
    }

    // Logic Alpha: Are services assigned to right work type
    if (service in eventMapper) {
        if (eventMapper[service] !== workType) {
            mark(serviceCell, "warning", true);
            mark(workTypeCell, "warning");
        }
        else {
            mark(serviceCell);
            mark(workTypeCell);
        }
    }

    if (!(service in eventMapper)) {
        mark(serviceCell, "unknown");
        mark(workTypeCell, "unknown");
    }

    // Logic Beta: Are services assigned to right contractor

    // And at the end, let's see how many totalEvents we have
    totalEvents++;
});

// Functions
// Marker for errors or correct values
function mark(element, type="non-error", increase=false) {
    let color = "green";
    if (type == "error") { 
        color = "red"; 
        if (increase) {
            errorCounts++;
        } 
    }
    else if (type == "warning") { 
        color = "orange"; 
        if (increase) { 
            warningCounts++; 
        }
    }

    else if (type == "unknown") {
        color = "blue";
    }

    element.style.backgroundColor = color;
    element.style.color = "white";

    if (color == "orange") {
        element.style.color = "black";
    }
}

// Showing the important information at the end
alert(`Hey Man, below are the stats
       > Total Events are: ${totalEvents}
       > Total Errors are: ${errorCounts}
       > Total Warnings are: ${warningCounts}`);