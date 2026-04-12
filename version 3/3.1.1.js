// ============================================================
// QFM Work Order Auditor
// Version 4.1.0
// ============================================================

// CONFIG: Set to true to only process rows assigned to Abhinav Singh.
//         Set to false to process all rows (Abhinav rows always process).
const FILTER_BY_ABHINAV = true;


// ============================================================
// Ignore Lists
// ============================================================

const ignoreOperativeFor = [
    "Humber IT", "Support Services", "GE", "Bio-Medical", "Security",
    "Bal John", "Central Dispatch", "Mike Orrico", "Clintar",
    "Todd Haynes", "Yondy Lam", "JCI Fire & Security"
];

const serviceIgnoreList  = ["General Facility", "Elevators"];
const remarksIgnoreList  = ["Jeff", "Duplicate", "Modern Niagara"];

const outOfScopeContractors = [
    "Humber IT", "Support Services", "GE",
    "Bio-Medical", "Security", "Todd Haynes", "Bal John"
];

// Contractors where the alias must appear in both remarks AND instructions.
const deepVerifyContractors = {
    "Humber IT":   ["Humber IT"],
    "Bio-Medical": ["Biomed"]
};


// ============================================================
// Nickname Map
// Add entries here as new nicknames come up.
// ============================================================

const nicknameMap = {
    "Matthew":     ["Matt"],
    "Michael":     ["Mike"],
    "Robert":      ["Rob"],
    "William":     ["Will", "Bill"],
    "James":       ["Jim"],
    "Richard":     ["Rich", "Rick"],
    "Joseph":      ["Joe"],
    "Thomas":      ["Tom"],
    "Christopher": ["Chris"],
    "Nicholas":    ["Nick"],
    "Jonathan":    ["Jon"],
    "Alexander":   ["Alex"],
    "Benjamin":    ["Ben"],
    "Nathaniel":   ["Nate", "Nathan"],
    "Samuel":      ["Sam"],
    "Daniel":      ["Dan"],
    "Anthony":     ["Tony"],
    "Patrick":     ["Pat"],
    "Timothy":     ["Tim"],
    "Lawrence":    ["Larry"],
    "Gregory":     ["Greg"],
    "Andrew":      ["Andy"],
    "Donald":      ["Don"],
    "Kenneth":     ["Ken"],
    "Ronald":      ["Ron"],
    "Charles":     ["Charlie", "Chuck"],
    "Gerald":      ["Jerry"],
    "Joshua":      ["Josh"],
};


// ============================================================
// Valid Statuses
// ============================================================

const validStatuses = new Set(["Response", "Rectification Due", "Rectification"]);


// ============================================================
// Event Groups
// ============================================================

const EVENT_GROUPS = {
    "Urgent AF": [
        "Toilet Blocked", "Elevators", "Sink", "Humidifiers",
        "Macerators", "Water System Cold", "Eyewash Stations",
    ],
    "Urgent SF": [
        "Nurse Call", "Fridge/Freezer", "Sterilizers", "Pneumatic Tube",
        "Patient Wandering", "Code Brown, Hazmat", "Odour",
        "Electrical Equipment", "Vents/Hatches", "Gas Medical",
        "Snow/Ice Clearance", "AGV", "Tap Faulty",
        "Transvac - Trash", "Transvac - Linen",
        "Neg Pressure RMs Activate/Deactivate", "CCTV",
        "Neg Pressure RMs Alarm", "Revolv/Overhead door",
        "Ceiling Patient Lifts", "ADO", "Refrigeration Plant",
        "Panic Duress",
    ],
    "Routine SF": [
        "Office Furniture (Desks, Chairs, Tables, Cabinet)",
        "Room Too Hot", "Room Too Cold", "Bed Management",
        "Medical Chairs (Geri, Bariatric, Commodes)",
        "Int. Repair Other", "Wheelchairs/Walkers",
        "Patient Room/Lounge Furniture", "IT/Telecoms",
        "Ice Machines", "Curtains/Rails", "Network",
        "Floors", "Partitions Internal", "Carts",
        "Walls Internal", "Hot Water Tower/Coffee Machines/Conveyor Toaster",
        "Dynamic Glass", "Blanket Warmers", "Paintwork Internal",
    ],
    "Emergency SF": ["Code White", "Code OB"],
    "Other": {
        "Out of Scope": "Inspect",
        "Keys": "General Facility Service",
        "Code White": "Emergency SF",
        "Code Blue": "Emergency SF",
        "General Facility": "General Facility Service",
    },
    "Shady": [
        "Lighting Internal", "Sink", "Door Internal",
        "Outlets", "Toilet Other", "Fans",
        "Ascom", "Water Supply", "Ceilings",
    ]
};


// ============================================================
// Build Lookup Maps
// ============================================================

const eventMapper   = {};
const shadyServices = new Set(EVENT_GROUPS.Shady);

Object.entries(EVENT_GROUPS).forEach(([group, services]) => {
    if (Array.isArray(services)) {
        services.forEach(service => { eventMapper[service] = group; });
    }
});
Object.entries(EVENT_GROUPS.Other).forEach(([service, workType]) => {
    eventMapper[service] = workType;
});

const COLORS = {
    error:      { bg: "red",     text: "#fff" },
    ok:         { bg: "green",   text: "#fff" },
    warning:    { bg: "maroon",  text: "#fff" },
    shady:      { bg: "orange",  text: "#000" },
    unverified: { bg: "cyan",    text: "#000" },
    unknown:    { bg: "blue",    text: "#fff" },
    abhinav:    { bg: "magenta", text: "#fff" },
};

// ============================================================
// Counters
// ============================================================

let totalEvents      = 0;
let errorCounts      = 0;
let shadyCounts      = 0;
let warningCounts    = 0;
let unverifiedCounts = 0;


// ============================================================
// Helpers
// ============================================================

function createField(cell) {
    return {
        cell,
        data:  cell?.textContent.trim() || "",
        error: false
    };
}

// Red is top priority. No colour can overwrite a red cell.
function mark(field, type = "ok", countIt = false) {
    if (field.error && type !== "error") return;

    const color = COLORS[type];
    if (!color) return;

    if (type === "error") {
        field.error = true;
        if (countIt) errorCounts++;
    } else if (type === "warning") {
        field.error = true;
        if (countIt) warningCounts++;
    } else if (type === "shady"      && countIt) shadyCounts++;
      else if (type === "unverified" && countIt) unverifiedCounts++;

    field.cell.style.backgroundColor = color.bg;
    field.cell.style.color            = color.text;
}

function firstName(fullName) {
    return fullName.split(" ")[0].trim();
}

function nameFoundInRemarks(operativeName, remarksText) {
    const remarks = remarksText.toLowerCase();
    const first   = firstName(operativeName).toLowerCase();

    const candidates = [first];

    Object.entries(nicknameMap).forEach(([formal, nicks]) => {
        if (formal.toLowerCase() === first) {
            nicks.forEach(n => candidates.push(n.toLowerCase()));
        }
        nicks.forEach(n => {
            if (n.toLowerCase() === first) {
                candidates.push(formal.toLowerCase());
            }
        });
    });

    return candidates.some(candidate => {
        const len = candidate.length;
        return remarks.indexOf(candidate.slice(0, len)) !== -1;
    });
}


// ============================================================
// Main Loop
// ============================================================

const table = document.getElementById("ctl00_CPH_rgED_GridData");

table.querySelectorAll("tr").forEach((row, index) => {
    if (index === 0) return;

    const cells = row.querySelectorAll("td");

    const fields = {
        event:        createField(cells[0]),
        status:       createField(cells[1]),
        location:     createField(cells[2]),
        service:      createField(cells[3]),
        workType:     createField(cells[4]),
        contractor:   createField(cells[5]),
        operative:    createField(cells[6]),
        instructions: createField(cells[7]),
        remarks:      createField(cells[8]),
        reportedBy:   createField(cells[9])
    };

    const isAbhinav =
        fields.instructions.data.includes("Abhinav Singh") ||
        fields.remarks.data.includes("Abhinav Singh");

    if (!isAbhinav && FILTER_BY_ABHINAV) return;


    // ----------------------------------------------------------
    // Rule: Status must be Response, Rectification Due, or Rectification.
    // Anything else flags the entire row red and stops processing.
    // ----------------------------------------------------------
    if (!validStatuses.has(fields.status.data)) {
        row.querySelectorAll("td").forEach(cell => {
            cell.style.backgroundColor = COLORS.error.bg;
            cell.style.color            = COLORS.error.text;
        });
        errorCounts++;
        totalEvents++;
        return;
    }


    // ----------------------------------------------------------
    // Rule: Abhinav name highlight
    // ----------------------------------------------------------
    if (isAbhinav) {
        if (fields.instructions.data.includes("Abhinav Singh")) {
            mark(fields.status, "abhinav");

            // Only raise this if remarks is not already empty
            // (empty remarks gets its own check below — one error per field).
            if (
                !fields.remarks.data.includes("Abhinav Singh") &&
                fields.remarks.data !== "" &&
                fields.remarks.data !== "\u00A0"
            ) {
                mark(fields.remarks, "error", true);
            }
        }

        if (
            fields.remarks.data.includes("Abhinav Singh") &&
            !fields.remarks.error
        ) {
            mark(fields.status, "abhinav");
        }
    }


    // ----------------------------------------------------------
    // Rule: Remarks empty
    // ----------------------------------------------------------
    if (fields.remarks.data === "" || fields.remarks.data === "\u00A0") {
        mark(fields.remarks, "error", true);
    }


    // ----------------------------------------------------------
    // Rule: Operative missing
    // ----------------------------------------------------------
    const operativeEmpty =
        fields.operative.data === "" || fields.operative.data === "\u00A0";

    if (operativeEmpty) {
        if (
            !ignoreOperativeFor.includes(fields.contractor.data) &&
            !serviceIgnoreList.includes(fields.service.data) &&
            !remarksIgnoreList.some(word => fields.remarks.data.includes(word))
        ) {
            mark(fields.operative, "error", true);
        }
    }


    // ----------------------------------------------------------
    // Rule: Operative name match in remarks (Unverified flag)
    //
    // Regular operatives: first name or nickname must be in remarks.
    // Deep-verify contractors (Humber IT, Bio-Medical): alias must
    // appear in both remarks and instructions.
    // "(Multiple Operatives)" is skipped.
    // This rule never raises an error, only unverified (cyan).
    // ----------------------------------------------------------
    if (!operativeEmpty && fields.operative.data !== "(Multiple Operatives)") {
        const contractor = fields.contractor.data;

        if (contractor in deepVerifyContractors) {
            const aliases        = deepVerifyContractors[contractor];
            const inRemarks      = aliases.some(a =>
                fields.remarks.data.toLowerCase().includes(a.toLowerCase())
            );
            const inInstructions = aliases.some(a =>
                fields.instructions.data.toLowerCase().includes(a.toLowerCase())
            );

            if (!inRemarks || !inInstructions) {
                if (!fields.remarks.error)      mark(fields.remarks,      "unverified", true);
                if (!fields.instructions.error) mark(fields.instructions, "unverified", false);
            } else {
                if (!fields.remarks.error)      mark(fields.remarks,      "ok");
                if (!fields.instructions.error) mark(fields.instructions, "ok");
            }
        } else if (!ignoreOperativeFor.includes(contractor)) {
            const found = nameFoundInRemarks(fields.operative.data, fields.remarks.data);
            if (!found && !fields.remarks.error) {
                mark(fields.remarks, "unverified", true);
            }
        }
    }


    // ----------------------------------------------------------
    // Rule: Temperature complaints
    // ----------------------------------------------------------
    if (
        fields.service.data === "Room Too Cold" ||
        fields.service.data === "Room Too Hot"
    ) {
        if (fields.remarks.data.includes("RDS")) {
            mark(fields.remarks, "ok");
        } else {
            mark(fields.remarks, "error", true);
        }

        const coldMatch = fields.service.data === "Room Too Cold" &&
                          fields.instructions.data.includes("cold");
        const hotMatch  = fields.service.data === "Room Too Hot"  &&
                          fields.instructions.data.includes("hot");

        if (coldMatch || hotMatch) {
            mark(fields.service,      "ok");
            mark(fields.instructions, "ok");
        } else {
            mark(fields.service,      "error", true);
            mark(fields.instructions, "error");
        }
    }


    // ----------------------------------------------------------
    // Rule: Out of Scope contractor validation
    // ----------------------------------------------------------
    if (fields.service.data === "Out of Scope") {
        if (!outOfScopeContractors.includes(fields.contractor.data)) {
            mark(fields.service, "error", true);
        } else {
            mark(fields.service,    "ok");
            mark(fields.contractor, "ok");
            mark(fields.workType,   "ok");
        }
    }

    if (outOfScopeContractors.includes(fields.contractor.data)) {
        if (fields.service.data !== "Out of Scope") {
            mark(fields.service, "error", true);
        }
    }


    // ----------------------------------------------------------
    // Rule: Mike Orrico + Rectification
    // ----------------------------------------------------------
    if (fields.contractor.data === "Mike Orrico") {
        if (fields.status.data === "Rectification") {
            mark(fields.status, "ok");
        }
    }


    // ----------------------------------------------------------
    // Rule: Service vs Work Type mapping
    // ----------------------------------------------------------
    if (fields.service.data in eventMapper) {
        if (shadyServices.has(fields.service.data)) {
            mark(fields.service,  "shady", true);
            mark(fields.workType, "shady");
        } else if (eventMapper[fields.service.data] !== fields.workType.data) {
            mark(fields.service,  "warning", true);
            mark(fields.workType, "warning");
        } else {
            mark(fields.service,  "ok");
            mark(fields.workType, "ok");
        }
    } else {
        mark(fields.service,  "unknown");
        mark(fields.workType, "unknown");
    }

    totalEvents++;
});


// ============================================================
// Summary
// ============================================================

alert(
    `Hey Man, below are the stats\n` +
    `> Total Events are: ${totalEvents}\n` +
    `> Total Errors are: ${errorCounts}\n` +
    `> Total Warnings are: ${warningCounts}\n` +
    `> Total Shadies are: ${shadyCounts}\n` +
    `> Total Unverified are: ${unverifiedCounts}`
);