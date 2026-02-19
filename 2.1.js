// Global Parent
const table = document.getElementById("ctl00_CPH_rgED_GridData");

// Counter
let totalEvents = 0;
let errorCounts = 0;
let shadyCounts = 0;
let warningCounts = 0;

// Lists
const ignoreOperativeFor = [
    "Humber IT", "Support Services", "GE", "Bio-Medical", "Security",
    "Bal John", "Central Dispatch", "Mike Orrico", "Clintar",
    "Todd Haynes", "Yondy Lam", "JCI Fire & Security"
];

const serviceIgnoreList = ["General Facility", "Elevators"];
const remarksIgnoreList = ["Jeff", "Duplicate", "Modern Niagara"];
const outOfScopeContractors = [
    "Humber IT", "Support Services", "GE",
    "Bio-Medical", "Security", "Todd Haynes", "Bal John"
];


// =============================
// Dictionary/Object to map the regular and most common services
// (cleaned, no repetition, same behaviour)
// =============================
const EVENT_GROUPS = {
    // UAF
    "Urgent AF": [
        "Toilet Blocked",
        "Elevators",
        "Sink",
        "Humidifiers",
        "Macerators",
        "Water System Cold",
        "Eyewash Stations",
    ],

    // USF
    "Urgent SF": [
        "Nurse Call",
        "Fridge/Freezer",
        "Sterilizers",
        "Pneumatic Tube",
        "Patient Wandering",
        "Code Brown, Hazmat",
        "Odour",
        "Electrical Equipment", 
        "Vents/Hatches",
        "Gas Medical",
        "Snow/Ice Clearance",
        "AGV",
        "Tap Faulty",
        "Transvac - Trash",
        "Transvac - Linen",
        "Neg Pressure RMs Activate/Deactivate",
        "CCTV",
        "Neg Pressure RMs Alarm",
        "Revolv/Overhead door",
        "Ceiling Patient Lifts",
        "ADO",
        "Refrigeration Plant",
        "Panic Duress",
    ],

    // RSF
    "Routine SF": [
        "Office Furniture (Desks, Chairs, Tables, Cabinet)",
        "Room Too Hot",
        "Room Too Cold",
        "Bed Management",
        "Medical Chairs (Geri, Bariatric, Commodes)",
        "Int. Repair Other",
        "Wheelchairs/Walkers",
        "Patient Room/Lounge Furniture",
        "IT/Telecoms",
        "Ice Machines",
        "Curtains/Rails",
        "Network",
        "Floors",
        "Partitions Internal",
        "Carts",
        "Walls Internal",
        "Hot Water Tower/Coffee Machines/Conveyor Toaster",
        "Dynamic Glass",
        "Blanket Warmers",
        "Paintwork Internal",
    ],

    "Emergency SF": [
        "Code White",
        "Code OB",
    ],

    // Others
    "Other": {
        "Out of Scope": "Inspect",
        "Keys": "General Facility Service",
        "Code White": "Emergency SF",
        "Code Blue": "Emergency SF",
        "General Facility": "General Facility Service",
    },

    // Shady
    "Shady": [
        "Lighting Internal",
        "Sink",
        "Door Internal",
        "Outlets",
        "Toilet Other",
        "Fans",
        "Ascom",
        "Water Supply",
        "Ceilings",
    ]
};


// =============================
// Build eventMapper automatically
// =============================
const eventMapper = {};

// Normal mappings
Object.entries(EVENT_GROUPS).forEach(([group, services]) => {
    if (Array.isArray(services)) {
        services.forEach(service => {
            eventMapper[service] = group;
        });
    }
});

// Explicit mappings
Object.entries(EVENT_GROUPS.Other).forEach(([service, workType]) => {
    eventMapper[service] = workType;
});

// Track shady services separately
const shadyServices = new Set(EVENT_GROUPS.Shady);


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

    // Cell methods
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

    // Logic 0: Check if I made IT
    if (fields.instructions.data.includes("Abhinav Singh")) {
        mark(fields.status, "abhinav");

        if (!(fields.remarks.data.includes("Abhinav Singh")) {
            mark(fields.remarks, "error", true);
        })
    }

    // Logic 1: Checking if required cells are empty (Remarks)
    if (
        fields.remarks.data === "" ||
        fields.remarks.data === "\u00A0"
    ) {
        mark(fields.remarks, "error", true);
    }

    // Logic 2: Checking the missing operative with the condition (was even required or not)
    if (
        fields.operative.data === "" ||
        fields.operative.data === "\u00A0"
    ) {
        if (
            !ignoreOperativeFor.includes(fields.contractor.data) &&
            !serviceIgnoreList.includes(fields.service.data) &&
            !remarksIgnoreList.some(word => fields.remarks.data.includes(word))
        ) {
            mark(fields.operative, "error", true);
        }
    }

    // Logic 3: Temperature events
    // 1. Template is Right
    // 2. Instructions Matches with Service
    if (
        fields.service.data == "Room Too Cold" ||
        fields.service.data == "Room Too Hot"
    ) {
        if (fields.remarks.data.includes("RDS")) {
            mark(fields.remarks);
        }
        else {
            mark(fields.remarks, "error", true);
        }

        // Instructions mathces with service
        // Service matches to Instructions
        if (
            (fields.service.data == "Room Too Cold" &&
                fields.instructions.data.includes("cold")) ||
            (fields.service.data == "Room Too Hot" &&
                fields.instructions.data.includes("hot"))
        ) {
            mark(fields.service);
            mark(fields.instructions);
        }
        else {
            mark(fields.service, "error", true);
            mark(fields.instructions, "error");
        }
    }

    // Logic 4: Out of Scope is assigned to right contractors only
    if (fields.service.data === "Out of Scope") {
        if (!outOfScopeContractors.includes(fields.contractor.data)) {
            mark(fields.service, "error", true);
        }
        else {
            mark(fields.service);
            mark(fields.contractor);
            mark(fields.workType);
        }
    }

    // Logic 5: Out of Scope Contractors have Out of Scope only
    if (outOfScopeContractors.includes(fields.contractor.data)) {
        if (fields.service.data !== "Out of Scope") {
            mark(fields.service, "error", true);
        }
    }

    // Logic 6: Mike Orrico is closed
    if (fields.contractor.data === "Milke Orrico") {
        if (fields.status.data === "Rectification") {
            mark(fields.status);
        }
    }

    // Logic Alpha: Are services assigned to right work type
    if (fields.service.data in eventMapper) {

        if (shadyServices.has(fields.service.data)) {
            mark(fields.service, "shady", true);
            mark(fields.workType, "shady");
        }

        else if (eventMapper[fields.service.data] !== fields.workType.data) {
            mark(fields.service, "warning", true);
            mark(fields.workType, "warning");
        }

        else {
            mark(fields.service);
            mark(fields.workType);
        }
    }

    if (!(fields.service.data in eventMapper)) {
        mark(fields.service, "unknown");
        mark(fields.workType, "unknown");
    }

    // Logic Beta: Are services assigned to right contractor
    // TODO

    // And at the end, let's see how many totalEvents we have
    totalEvents++;
});


// Functions
// Marker for errors or correct values
function mark(field, type = "non-error", increase = false) {
    if ((type === "non-error") && field.error) return;

    let color = "green";

    if (type == "error") {
        color = "red";
        field.error = true;
        if (increase) errorCounts++;
    }
    else if (type == "warning") {
        color = "maroon";
        field.error = true;
        if (increase) warningCounts++;
    }
    else if (type == "unknown") {
        color = "blue";
    }
    else if (type == "shady") {
        color = "orange";
        if (increase) shadyCounts++;
    }
    else if (type == "abhinav") {
        color = "magenta"
    }

    field.cell.style.backgroundColor = color;
    field.cell.style.color = color === "orange" ? "black" : "white";
}


// Showing the important information at the end
alert(`Hey Man, below are the stats
       > Total Events are: ${totalEvents}
       > Total Errors are: ${errorCounts}
       > Total Shadies are: ${shadyCounts}
       > Total Warnings are: ${warningCounts}`);
