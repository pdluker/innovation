// ideas-source.js
// Curated, hand-vetted pool. The model NEVER invents the business, the
// competitor list, or the capital numbers - it only writes the brief around
// these fields. Top this file up manually; treat it as the editorial layer.
//
// ASCII PUNCTUATION ONLY in this file. Straight quotes, straight hyphens.
// (PowerShell 5.1 corrupts non-ASCII on read/write - spec gotcha 3.)
//
// Schema consumed by script.js and index.js. If you change it, confirm the
// NEXT REAL GENERATED EPISODE reflects the new fields (spec gotcha 10) -
// a parse check is not enough.
//
// Field contract:
//   id             string, stable, kebab-case, used as the "used" tracking key
//   title          display title
//   category       one of: Vertical AI, AI Ops, Data Products, AI Services,
//                  Infra & Tooling, Consumer AI, Physical + AI
//   thesis         one sentence, the business in plain terms
//   customer       who pays, specifically
//   need           2-3 sentences on why this exists now
//   competitors    array of REAL named companies/products. Verified, not guessed.
//   complexity     1-5 integer. 1 = weekend. 5 = hardest thing you can do solo.
//   complexityWhy  one sentence justifying the number
//   capital        { total: <= 100000, lines: [{ label, amount }] } - must sum to total
//   firstNinety    array of exactly 3 strings: days 1-30, 31-60, 61-90
//   claudeRole     how Claude covers the skill gap (this show's whole premise)
//   moat           what stops the second person who reads this from eating you
//   sourceNotes    where the market claim comes from - keep it verifiable

export const IDEAS = [
  {
    id: "rfp-response-shop",
    aiLeverage: 4, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 2, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "AI-Assisted Proposal Shop for Small Federal Primes",
    category: "AI Services",
    thesis: "A two-person shop that turns a small business's win themes into compliant federal proposal volumes, with Claude doing the compliance matrix and first-draft narrative.",
    customer: "8(a), SDVOSB and small-business primes bidding $2M-$50M task orders who cannot carry a full-time capture team.",
    need: "Federal proposal work is still bought by the hour from consultants, or pulled from a small firm's best billable people. The compliance matrix, the shred, the Section L/M cross-walk, and the first-pass narrative are exactly the tasks a language model does well. The buyer already has a budget line for this and already accepts contractor labor.",
    competitors: ["Deltek GovWin IQ", "Unanet ProposalAI", "AutogenAI", "Rohirrim", "Shipley Associates (traditional consulting)"],
    complexity: 2,
    complexityWhy: "No product to build - the hard part is the first three references, not the technology.",
    capital: { total: 34000, lines: [
      { label: "Entity, insurance, GSA/SAM registration", amount: 6000 },
      { label: "Model and tooling spend, year one", amount: 6000 },
      { label: "Two pilot engagements delivered at cost", amount: 12000 },
      { label: "Runway reserve", amount: 10000 }
    ]},
    firstNinety: [
      "Build the compliance-matrix and shred workflow against three real, publicly posted RFPs. Deliver two of them free to firms you already know for the reference and the redline.",
      "Convert one pilot to a paid per-volume rate. Publish the turnaround-time number, not the technology.",
      "Add a second delivery person on 1099. Target three concurrent bids as the capacity ceiling before hiring."
    ],
    claudeRole: "Section L/M shredding, compliance matrix generation, past-performance rewriting to the current solicitation's evaluation language, and consistency checking across volumes.",
    moat: "Domain credibility and cleared reference customers. The workflow is copyable; the reference list is not.",
    sourceNotes: "Payscale lists APMP-certified proposal managers at about $71k-$143k, the labor-cost baseline. AutogenAI and Rohirrim funding rounds establish the software category."
  },
  {
    id: "claims-denial-appeals",
    aiLeverage: 4, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 4, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Insurance Denial Appeal Service for Independent Clinics",
    category: "Vertical AI",
    thesis: "Flat-fee appeals of denied medical claims for small practices, where the appeal letter is drafted against the payer's own published coverage policy.",
    customer: "Independent practices and small specialty groups with 2-15 providers and no dedicated denials analyst.",
    need: "HFMA reports that up to 65 percent of denied claims are never resubmitted, and a small practice rarely has anyone whose job is to work them. The payer's medical policy is a public document and the denial reason code tells you which paragraph to argue against. That is a structured writing problem with a direct dollar recovery attached.",
    competitors: ["Waystar", "Availity", "Infinitus", "Adonis", "Candid Health"],
    complexity: 4,
    complexityWhy: "HIPAA, a BAA with every client, and PHI handling raise the floor well above a normal services business.",
    capital: { total: 58000, lines: [
      { label: "HIPAA compliance, BAAs, security review", amount: 14000 },
      { label: "Healthcare attorney, entity setup", amount: 9000 },
      { label: "Clearinghouse and EHR integration work", amount: 15000 },
      { label: "Model and infrastructure spend", amount: 8000 },
      { label: "Runway reserve", amount: 12000 }
    ]},
    firstNinety: [
      "Pick one specialty and one payer. Learn that payer's policy library cold before writing a line of code.",
      "Run 50 real denials manually end to end. Measure overturn rate. That number is the entire sales pitch.",
      "Move to contingency pricing on recovered dollars only after the overturn rate is stable."
    ],
    claudeRole: "Mapping denial reason codes to the specific policy paragraph, drafting the appeal argument, and tracking which arguments actually get overturned.",
    moat: "The overturn-rate dataset per payer per denial code. It compounds and it is not public.",
    sourceNotes: "HFMA reports up to 65 percent of denied claims are never resubmitted; the Change Healthcare Denials Index put initial denials at 12 percent of claims in 2022. Payer medical policies are public."
  },
  {
    id: "permit-expediter",
    aiLeverage: 3, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 2, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Municipal Permit Expediting for Residential Contractors",
    category: "Vertical AI",
    thesis: "You handle the permit package - drawings review, code cross-reference, submittal, and correction cycles - for remodelers in one metro.",
    customer: "Residential general contractors and remodelers doing 20-100 jobs a year in a single jurisdiction.",
    need: "Permit correction cycles stall residential remodels, and many correction comments repeat from job to job. Municipal codes are published, the submittal checklists are published, and the reviewer's comments are formulaic. A contractor will happily pay a fixed fee to never think about it.",
    competitors: ["PermitFlow", "Pulley", "GreenLite", "Local expediting firms (fragmented, offline)"],
    complexity: 2,
    complexityWhy: "One jurisdiction, public rules, no PHI or money movement. The constraint is your own bandwidth.",
    capital: { total: 22000, lines: [
      { label: "Entity, E&O insurance, licensing", amount: 5000 },
      { label: "Code libraries, plan-review software", amount: 4000 },
      { label: "First 10 jobs delivered at cost", amount: 8000 },
      { label: "Runway reserve", amount: 5000 }
    ]},
    firstNinety: [
      "Sit through public plan-review sessions in your city. Catalogue the 20 most common correction comments.",
      "Sign three contractors on a flat per-permit fee. Guarantee resubmittal at no charge.",
      "Add the second jurisdiction only after the first one is boring."
    ],
    claudeRole: "Cross-referencing submitted drawings against the local amendments to the IRC/IBC, drafting correction responses, and maintaining the per-reviewer comment history.",
    moat: "Relationships with the plan reviewers in one building department. Deeply local, deliberately unscalable, and that is the point.",
    sourceNotes: "ICC model codes and municipal amendments are public; PermitFlow's $54M Series B and Pulley's seed round establish the category."
  },
  {
    id: "board-packet-service",
    aiLeverage: 4, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 2, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Board Packet and Minutes Service for Small Nonprofits",
    category: "AI Services",
    thesis: "Monthly retainer to turn a nonprofit's messy financials and program updates into a real board packet, plus compliant minutes from the recording.",
    customer: "Nonprofits with $1M-$20M budgets, one part-time finance person, and a board that expects governance quality they are not resourced for.",
    need: "Board packets are a recurring, deadline-driven document assembly job that nobody on staff wants. The inputs are the same every month. The failure mode - a board that cannot see the numbers clearly - is a real governance risk that executive directors already worry about.",
    competitors: ["BoardEffect (Diligent)", "Boardable", "OnBoard", "Fractional nonprofit bookkeepers and CFO firms"],
    complexity: 1,
    complexityWhy: "Recurring document work with no regulated data and no integrations required on day one.",
    capital: { total: 11000, lines: [
      { label: "Entity, insurance", amount: 3000 },
      { label: "Model and transcription spend", amount: 3000 },
      { label: "Three pilot clients at cost", amount: 3000 },
      { label: "Runway reserve", amount: 2000 }
    ]},
    firstNinety: [
      "Serve one nonprofit free for two board cycles. Build the template from their actual chart of accounts.",
      "Price at a monthly retainer per organization. Sell through the executive director, never the board.",
      "Templatize by vertical - arts, human services, foundations - and resell the template, not the hours."
    ],
    claudeRole: "Financial narrative from raw statements, minutes from recordings, consistency checks against the prior packet, and drafting the ED's report.",
    moat: "Executive directors talk to each other constantly. This is a referral business with almost no churn.",
    sourceNotes: "National Council of Nonprofits: 97 percent of nonprofits run on under $5 million a year, so the $1M-$20M target is a narrow slice of the sector."
  },
  {
    id: "spec-to-takeoff",
    aiLeverage: 3, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 3, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Spec-to-Takeoff for Specialty Subcontractors",
    category: "Vertical AI",
    thesis: "Turn a bid set of drawings and specs into a quantity takeoff and a priced bid for one trade - electrical, mechanical, or low-voltage.",
    customer: "Specialty subs doing $3M-$30M a year who bid more than they win and estimate at night.",
    need: "Estimating is the bottleneck on every subcontractor's growth. Estimator hours cap how many bids a sub can chase in a week. Drawings and specs are structured documents, and the takeoff step is pattern recognition against a known assembly list.",
    competitors: ["Togal.AI", "Beam AI", "Trunk Tools", "STACK", "Procore Estimating"],
    complexity: 4,
    complexityWhy: "Drawing interpretation is genuinely hard and a wrong takeoff costs your client real money.",
    capital: { total: 71000, lines: [
      { label: "Vision/document tooling and compute", amount: 20000 },
      { label: "Estimator on contract to validate output", amount: 24000 },
      { label: "E&O insurance at a meaningful limit", amount: 9000 },
      { label: "Entity and legal", amount: 6000 },
      { label: "Runway reserve", amount: 12000 }
    ]},
    firstNinety: [
      "Pick one trade. Get 30 historical bid sets with the actual as-built quantities from a friendly sub.",
      "Run your takeoff against those 30 and publish the variance. Do not sell until variance is under the sub's own estimator's.",
      "Charge per bid set, not per seat. The sub is buying bid volume, not software."
    ],
    claudeRole: "Spec section parsing, assembly identification, exclusions and clarifications language, and the bid cover letter.",
    moat: "The validated variance number against real as-builts in one trade.",
    sourceNotes: "Togal.AI and Trunk Tools funding rounds establish the category; CFMA's Benchmarker publishes subcontractor financial ratios."
  },
  {
    id: "lease-abstract",
    aiLeverage: 4, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 3, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Commercial Lease Abstraction for Regional Property Managers",
    category: "Data Products",
    thesis: "Convert a PDF lease portfolio into a structured, queryable abstract - critical dates, escalations, options, recovery terms - with a human check on every field.",
    customer: "Regional commercial property managers and small REIT-adjacent owners with 20-300 leases sitting in a shared drive.",
    need: "Missed renewal options and unbilled CAM recoveries are pure, avoidable revenue loss, and the reason they get missed is that the terms live in scanned PDFs nobody reads. One caught option renewal or unbilled recovery can be worth more than the annual fee.",
    competitors: ["VTS", "Prophia", "FinQuery (formerly LeaseQuery)", "Visual Lease", "Yardi"],
    complexity: 3,
    complexityWhy: "Accuracy expectations are absolute - one wrong escalation date destroys trust in the whole abstract.",
    capital: { total: 39000, lines: [
      { label: "Model, OCR and infrastructure spend", amount: 10000 },
      { label: "Part-time paralegal reviewer", amount: 15000 },
      { label: "Entity, E&O insurance", amount: 7000 },
      { label: "Runway reserve", amount: 7000 }
    ]},
    firstNinety: [
      "Abstract 25 leases for one owner at cost. Have a paralegal check every field and log the error rate by field type.",
      "Price per lease abstracted with a re-abstraction guarantee. Deliver into their existing system, not yours.",
      "Sell the second engagement on the first client's caught-option dollar figure."
    ],
    claudeRole: "Clause extraction, date and escalation math, non-standard term flagging, and generating the exception report a human actually reviews.",
    moat: "Per-field error rates and a reviewer workflow that gets cheaper as the flagging improves.",
    sourceNotes: "ASC 842 put operating leases on the balance sheet and created the lease-administration software category. No published figure for missed options or CAM leakage was found - treat the dollar case as an assumption to test."
  },
  {
    id: "grant-compliance-reporting",
    aiLeverage: 4, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 3, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Federal Grant Reporting for Small Municipalities",
    category: "AI Services",
    thesis: "You produce the quarterly and closeout reports for small cities and counties drawing down federal grant funds.",
    customer: "Municipalities under 50,000 people with one grants person wearing four other hats.",
    need: "Noncompliance can mean disallowed costs that must be repaid, and GAO has documented that limited staff capacity keeps small jurisdictions from fully accessing and managing federal grants. The reporting formats are federally standardized and published. The buyer has an existing, allowable administrative cost line to pay you from.",
    competitors: ["Euna Grants (eCivis and AmpliFund)", "Submittable", "Local grant consultants"],
    complexity: 2,
    complexityWhy: "Standardized formats and a public buyer, but procurement cycles are slow and you must know Uniform Guidance.",
    capital: { total: 26000, lines: [
      { label: "Entity, insurance, SAM registration", amount: 5000 },
      { label: "Uniform Guidance training and reference", amount: 4000 },
      { label: "Two pilot municipalities at cost", amount: 10000 },
      { label: "Runway reserve", amount: 7000 }
    ]},
    firstNinety: [
      "Learn 2 CFR 200 properly. This is the one where the domain knowledge is not optional.",
      "Take two municipalities through a full quarterly cycle at cost. Get a letter from the finance director.",
      "Sell to the regional council of governments, not city by city."
    ],
    claudeRole: "Narrative report drafting from expenditure data, allowability checking against 2 CFR 200, and closeout package assembly.",
    moat: "One state's grant landscape plus a council-of-governments relationship covers dozens of towns.",
    sourceNotes: "2 CFR 200 (Uniform Guidance) is public, including the noncompliance remedies in 200.339; GAO-23-106797 documents grant-capacity gaps."
  },
  {
    id: "shopify-catalog-ops",
    aiLeverage: 4, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 1, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Product Catalog Operations for Mid-Market E-commerce",
    category: "AI Ops",
    thesis: "Ongoing retainer to keep a large catalog clean - descriptions, attributes, variant hygiene, category mapping, marketplace feeds.",
    customer: "Brands and distributors with 5,000-500,000 SKUs selling across their own store plus two or more marketplaces.",
    need: "Catalog quality directly drives conversion and marketplace search placement, and it decays continuously as SKUs are added by whoever happens to add them. Nobody owns it. It is high-volume structured text work with a measurable revenue tie.",
    competitors: ["Akeneo", "Salsify", "Productsup", "Feedonomics (Commerce, formerly BigCommerce)", "Jasper"],
    complexity: 2,
    complexityWhy: "Volume is the challenge, not difficulty. The work is measurable and the failure modes are cheap.",
    capital: { total: 19000, lines: [
      { label: "Model and pipeline compute", amount: 7000 },
      { label: "Entity, insurance", amount: 3000 },
      { label: "First two accounts at cost", amount: 5000 },
      { label: "Runway reserve", amount: 4000 }
    ]},
    firstNinety: [
      "Run a free catalog audit for five brands. The audit itself is the sales asset.",
      "Convert one to a monthly retainer priced on SKUs under management.",
      "Instrument conversion lift on the SKUs you touched. That number renews the contract."
    ],
    claudeRole: "Description generation at scale in the brand's voice, attribute normalization, category mapping, and duplicate detection.",
    moat: "Weak on its own. The defensibility is the conversion-lift measurement, so build that from day one.",
    sourceNotes: "Salsify's 2025 consumer research: 54 percent of shoppers abandoned a sale over inconsistent product content across channels. Marketplace listing quality rules are public."
  },
  {
    id: "clinical-trial-feasibility",
    aiLeverage: 3, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 4, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Site Feasibility Screening for Clinical Research Sites",
    category: "Vertical AI",
    thesis: "Screen incoming trial protocols against a research site's actual patient population to tell them, fast, which studies they can realistically enroll.",
    customer: "Independent and hospital-affiliated clinical research sites that receive more protocol invitations than they can evaluate.",
    need: "Sites lose money on trials they should never have accepted, because feasibility assessment is a manual read of a 100-page protocol against an EHR population they can only estimate. Tufts CSDD found that about one site in ten enrolls no patients and about four in ten under-enroll.",
    competitors: ["Medidata", "Veeva SiteVault", "TriNetX", "Curebase", "Advarra"],
    complexity: 5,
    complexityWhy: "PHI, IRB context, and a buyer who will not move on a vendor without institutional review.",
    capital: { total: 88000, lines: [
      { label: "HIPAA program, security assessment", amount: 20000 },
      { label: "Clinical advisor on retainer", amount: 24000 },
      { label: "EHR/FHIR integration work", amount: 18000 },
      { label: "Legal, entity, insurance", amount: 12000 },
      { label: "Runway reserve", amount: 14000 }
    ]},
    firstNinety: [
      "Do not build. Manually screen protocols for one site for a quarter and record every judgment call.",
      "Only after that, automate the inclusion/exclusion matching against de-identified counts.",
      "Price per protocol screened. Sites understand that unit."
    ],
    claudeRole: "Inclusion/exclusion criteria extraction from the protocol, mapping to structured EHR concepts, and the feasibility memo itself.",
    moat: "Institutional trust plus the site's own historical enrollment-accuracy record.",
    sourceNotes: "Tufts CSDD publishes site enrollment-performance research; ClinicalTrials.gov protocols are public."
  },
  {
    id: "hoa-management-back-office",
    aiLeverage: 3, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 3, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Back Office for Self-Managed HOAs",
    category: "AI Ops",
    thesis: "Minutes, violation letters, vendor bid comparison, reserve-study summaries and owner correspondence for HOAs that refuse to hire a management company.",
    customer: "Self-managed associations of 50-400 doors, run by volunteer boards who are drowning in paperwork.",
    need: "Full-service HOA management is priced per door and often unwanted - boards want to keep control. But the correspondence, minutes and violation workflow is real, recurring, and legally sensitive work that volunteers do badly. There is a middle tier nobody serves well.",
    competitors: ["AppFolio", "Buildium (RealPage)", "Vantaca", "HOA management companies (full-service)"],
    complexity: 2,
    complexityWhy: "Low technical risk, but violation letters have legal weight - templates need attorney review once.",
    capital: { total: 16000, lines: [
      { label: "Attorney review of letter templates", amount: 5000 },
      { label: "Entity, insurance", amount: 3000 },
      { label: "Model and tooling spend", amount: 3000 },
      { label: "Runway reserve", amount: 5000 }
    ]},
    firstNinety: [
      "Serve your own or a neighboring association free for one quarter. Learn the actual annual cycle.",
      "Get letter templates attorney-reviewed once for your state, then reuse across every client.",
      "Price monthly per association, not per door. Boards respond to predictability."
    ],
    claudeRole: "Meeting minutes, violation and cure letters from the CC&Rs, bid comparison summaries, and the annual meeting packet.",
    moat: "State-specific CC&R fluency and a board-to-board referral loop within one metro.",
    sourceNotes: "The Foundation for Community Association Research estimates 30 to 40 percent of associations are self-managed."
  },
  {
    id: "expert-witness-prep",
    aiLeverage: 4, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 3, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Deposition and Exhibit Support for Solo Litigators",
    category: "AI Services",
    thesis: "Deposition digests, exhibit indexes, and timeline reconstruction for solo and two-partner litigation firms.",
    customer: "Solo litigators and small firms handling document-heavy cases without paralegal depth.",
    need: "Document review and deposition digesting is the work that keeps small firms from taking bigger cases. Big firms have contract attorneys for this. Solos have their own nights and weekends. The output format is standardized and the input is text.",
    competitors: ["Everlaw", "Relativity", "CoCounsel (Thomson Reuters)", "Clearbrief", "Legal contract-attorney staffing"],
    complexity: 3,
    complexityWhy: "Confidentiality and privilege handling are non-negotiable, and accuracy failures are career-level for the client.",
    capital: { total: 31000, lines: [
      { label: "Security infrastructure, confidentiality controls", amount: 10000 },
      { label: "Entity, E&O insurance", amount: 8000 },
      { label: "Model and infrastructure spend", amount: 6000 },
      { label: "Runway reserve", amount: 7000 }
    ]},
    firstNinety: [
      "Pick one case type - employment, PI, construction defect. Build the digest format lawyers in that niche already expect.",
      "Do three cases at cost. Ask for the redline of your first digest and rebuild the format around it.",
      "Price per deposition hour digested. Never per project."
    ],
    claudeRole: "Deposition digesting with cite-to-page accuracy, timeline reconstruction across exhibits, and inconsistency flagging between witnesses.",
    moat: "Format fit within one practice niche plus a bar-association referral position.",
    sourceNotes: "ABA's 2024 Solo and Small Firm TechReport documents the resource constraints small firms work under."
  },
  {
    id: "manufacturing-work-instructions",
    aiLeverage: 3, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 3, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Work Instruction Modernization for Small Manufacturers",
    category: "AI Ops",
    thesis: "Turn tribal knowledge and 1990s Word documents into current, photo-illustrated, audit-ready work instructions.",
    customer: "Contract manufacturers and job shops with 20-200 employees facing an ISO or AS9100 audit, or a retirement wave.",
    need: "The person who knows how the machine actually runs is retiring, and the written instruction is either wrong or does not exist. This is simultaneously a quality-audit problem, a training problem, and a continuity problem, and it has a hard deadline attached whenever the audit is scheduled.",
    competitors: ["Tulip Interfaces", "Dozuki", "Augmentir", "VKS", "Mitti (formerly SafetyCulture)"],
    complexity: 2,
    complexityWhy: "The work is on-site interviews and document production - low technical risk, high travel.",
    capital: { total: 24000, lines: [
      { label: "Entity, insurance", amount: 4000 },
      { label: "Camera, on-site capture kit, travel", amount: 7000 },
      { label: "Two shops delivered at cost", amount: 8000 },
      { label: "Runway reserve", amount: 5000 }
    ]},
    firstNinety: [
      "Find one shop with an audit in six months. Urgency does your selling for you.",
      "Interview and film the operators. The instruction quality comes from the interview, not the model.",
      "Price per work cell documented. Sell the second shop on the first one's audit result."
    ],
    claudeRole: "Turning interview transcripts into structured instructions, mapping them to the relevant ISO/AS9100 clause, and maintaining revision control language.",
    moat: "Local manufacturing associations are tight networks. One clean audit result sells the next five shops.",
    sourceNotes: "NIST MEP documents the aging-workforce and retirement pressure on small manufacturers."
  },
  {
    id: "utility-bill-audit",
    aiLeverage: 4, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 3, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Utility and Telecom Bill Audit for Multi-Site Businesses",
    category: "Data Products",
    thesis: "Contingency-fee audit of utility, telecom and waste invoices across a company's sites, recovering billing errors and dead accounts.",
    customer: "Franchise groups, restaurant groups, clinics and retailers with 10-200 locations.",
    need: "Multi-site invoice errors persist for years because no single person sees all the bills. Investor-owned utility tariffs are public, and the common errors repeat - wrong rate class, meters on closed locations, services billed after disconnect. The client pays nothing unless you find money.",
    competitors: ["Cass Information Systems", "Tangoe", "Schneider Electric Resource Advisor", "Local contingency auditors"],
    complexity: 2,
    complexityWhy: "Contingency pricing removes the sales objection entirely; the constraint is getting document access.",
    capital: { total: 21000, lines: [
      { label: "Entity, insurance", amount: 4000 },
      { label: "Model, OCR and data infrastructure", amount: 7000 },
      { label: "Working capital during contingency lag", amount: 7000 },
      { label: "Runway reserve", amount: 3000 }
    ]},
    firstNinety: [
      "Audit one friendly multi-site business free. Whatever you find is your case study.",
      "Standardize on one utility territory's tariff structure before expanding.",
      "Take 30-40 percent of recovered and avoided cost for 12 months. Get the letter of authority signed up front."
    ],
    claudeRole: "Invoice parsing across dozens of formats, rate-class comparison against published tariffs, and anomaly detection across sites.",
    moat: "Tariff libraries per territory plus a track record that makes the contingency contract easy to sign.",
    sourceNotes: "Investor-owned utilities file tariffs with state commissions, which publish them (Missouri PSC's EFIS, for example); the contingency audit model is long-established."
  },
  {
    id: "curriculum-alignment",
    aiLeverage: 4, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 2, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Curriculum Alignment Documentation for Private Schools",
    category: "AI Services",
    thesis: "Produce accreditation-ready curriculum maps, scope-and-sequence documents and standards alignment for schools facing a review cycle.",
    customer: "Private and charter schools in an accreditation year with no curriculum director on staff.",
    need: "Accreditation review demands documentation that reflects what teachers actually do, and teachers do not have the hours to write it. The standards frameworks are public, the accreditation rubrics are public, and the deadline is fixed and known years in advance.",
    competitors: ["Faria Education Group (Atlas, ManageBac)", "Otus", "Independent accreditation consultants"],
    complexity: 1,
    complexityWhy: "Document production against published rubrics, with a naturally deadline-driven buyer.",
    capital: { total: 13000, lines: [
      { label: "Entity, insurance", amount: 3000 },
      { label: "Accreditation framework references", amount: 2000 },
      { label: "One school delivered at cost", amount: 5000 },
      { label: "Runway reserve", amount: 3000 }
    ]},
    firstNinety: [
      "Pick one accrediting body. Learn its rubric completely.",
      "Deliver one school's full map at cost, timed to their actual review.",
      "Sell through the accrediting body's conference circuit, where every attendee has the same deadline."
    ],
    claudeRole: "Mapping teacher-submitted units to standards, generating scope and sequence, and drafting the self-study narrative.",
    moat: "One accrediting body's rubric fluency plus conference presence in a small, well-networked market.",
    sourceNotes: "Accreditation standards are published - Cognia's performance standards and rubric, for example."
  },
  {
    id: "restaurant-menu-margin",
    aiLeverage: 3, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 2, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Menu Engineering and Cost Tracking for Independent Restaurants",
    category: "Data Products",
    thesis: "Weekly recalculation of plate costs against actual invoice prices, with menu pricing and item-mix recommendations.",
    customer: "Independent restaurant groups with 2-10 locations and no corporate finance function.",
    need: "Food costs move weekly and menus reprice quarterly at best, so margin erodes invisibly between the invoice and the menu board. Owners know this is happening and cannot get to it. The invoices are digital and the recipes are fixed.",
    competitors: ["MarginEdge", "Restaurant365", "xtraCHEF (Toast)", "Craftable"],
    complexity: 3,
    complexityWhy: "The category has well-funded incumbents; you win on price and hand-holding, not features.",
    capital: { total: 28000, lines: [
      { label: "Model, OCR and infrastructure", amount: 9000 },
      { label: "POS integration work", amount: 8000 },
      { label: "Entity, insurance", amount: 4000 },
      { label: "Runway reserve", amount: 7000 }
    ]},
    firstNinety: [
      "Serve three restaurants manually. Weekly plate cost by hand tells you what the report should say.",
      "Automate only after the report is one they already read every week.",
      "Price monthly per location, well under the incumbents, and win on service."
    ],
    claudeRole: "Invoice line-item extraction, recipe cost recalculation, and writing the plain-language weekly margin note the owner actually reads.",
    moat: "Thin on features. The moat is being the person the owner texts, in one city.",
    sourceNotes: "National Restaurant Association: food and beverage ran a median 31 percent of sales for fullservice operators in 2024, and wholesale food prices remain more than 30 percent above early 2020."
  },
  {
    id: "sbir-proposal",
    aiLeverage: 4, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 4, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "SBIR/STTR Proposal Support for First-Time Applicants",
    category: "AI Services",
    thesis: "Get technical founders through their first Phase I SBIR - topic matching, commercialization plan, budget justification, and compliance.",
    customer: "Technical founders and small labs who have never applied and would not otherwise try.",
    need: "SBIR is non-dilutive money that goes unclaimed because the application is procedurally intimidating rather than technically hard. The topics, the solicitation schedules and the evaluation criteria are all public.",
    competitors: ["BBCetc", "Granted AI", "TurboSBIR", "Freelance SBIR consultants", "University tech transfer offices"],
    complexity: 2,
    complexityWhy: "Public rules, motivated buyers, and long solicitation cycles that let you plan capacity.",
    capital: { total: 18000, lines: [
      { label: "Entity, insurance", amount: 4000 },
      { label: "SBIR training and reference materials", amount: 3000 },
      { label: "Three applications supported at cost", amount: 7000 },
      { label: "Runway reserve", amount: 4000 }
    ]},
    firstNinety: [
      "Pick two agencies with different styles - DoD and NIH read very differently.",
      "Support three first-time applicants at cost through a full cycle. Track awards honestly, including the losses.",
      "Charge a flat fee plus a success bonus. Never contingency-only; the cycle is too long to fund."
    ],
    claudeRole: "Topic matching against the solicitation, commercialization plan drafting, budget justification narrative, and compliance checking.",
    moat: "Award rate by agency, published honestly. It is the only credential that matters in this market.",
    sourceNotes: "SBIR.gov publishes solicitations and award data."
  },
  {
    id: "safety-program-docs",
    aiLeverage: 3, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 2, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "OSHA Safety Program Documentation for Small Contractors",
    category: "AI Services",
    thesis: "Written safety programs, job hazard analyses and toolbox talks that satisfy general-contractor prequalification requirements.",
    customer: "Subcontractors being asked for a written safety program to get on a general contractor's bid list.",
    need: "Being blocked from a bid list for missing documentation is an immediate, quantified revenue loss - and the requesting GC has already told the sub exactly what is missing. The standards are federal and published, and the document set templates well by trade - though it has to be tailored to each contractor's actual operations.",
    competitors: ["Novara (formerly KPA Flex)", "Mitti (formerly SafetyCulture)", "Avetta / ISNetworld (the prequalification platforms themselves)", "Local safety consultants"],
    complexity: 1,
    complexityWhy: "Templated documents against public standards with a buyer under immediate commercial pressure.",
    capital: { total: 12000, lines: [
      { label: "Entity, insurance", amount: 3000 },
      { label: "Safety certification coursework", amount: 4000 },
      { label: "Two clients at cost", amount: 3000 },
      { label: "Runway reserve", amount: 2000 }
    ]},
    firstNinety: [
      "Get one real safety credential. It is cheap and it is the whole reason they trust the document.",
      "Build the trade-specific template library from OSHA standards and ISNetworld requirements.",
      "Sell where subs already gather - supply houses, trade association meetings, prequalification deadlines."
    ],
    claudeRole: "Program drafting against the applicable OSHA standard, JHAs by task, and the ongoing toolbox-talk calendar.",
    moat: "Trade-specific template depth and a recurring annual update relationship.",
    sourceNotes: "OSHA standards are public; Avetta and ISNetworld require a written health and safety program for prequalification."
  },
  {
    id: "estate-inventory",
    aiLeverage: 3, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 4, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Estate Inventory and Probate Documentation Service",
    category: "AI Services",
    thesis: "Assemble the asset inventory, appraisal coordination and court-required accounting for executors handling a probate.",
    customer: "Individual executors - usually adult children - and the estate attorneys who would rather not do inventory work.",
    need: "An executor is an unwilling amateur handling a deadline-driven court process during a bad year of their life. Attorneys bill this work at their rate and dislike it. The court forms are published and the process is mechanical once the assets are identified.",
    competitors: ["EstateExec", "Atticus", "Trust & Will", "Estate attorneys doing it in-house"],
    complexity: 2,
    complexityWhy: "No license required for inventory work in most states, but be scrupulous about not practicing law.",
    capital: { total: 17000, lines: [
      { label: "Entity, bonding, insurance", amount: 6000 },
      { label: "Attorney review of scope boundaries", amount: 4000 },
      { label: "Model and tooling spend", amount: 3000 },
      { label: "Runway reserve", amount: 4000 }
    ]},
    firstNinety: [
      "Confirm with a local attorney exactly where the unauthorized-practice line sits in your state. Write it down.",
      "Build the referral relationship with three estate attorneys before touching a single estate.",
      "Flat fee by estate complexity tier. Attorneys refer volume when the fee is predictable."
    ],
    claudeRole: "Document sorting and asset identification from statements, court form population, and the accounting narrative.",
    moat: "Attorney referral relationships in one county. Slow to build, very hard to displace.",
    sourceNotes: "State probate court forms and executor duties are published by county court systems."
  },
  {
    id: "podcast-to-content",
    aiLeverage: 4, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 1, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Long-Form Audio to Multi-Channel Content for B2B Firms",
    category: "AI Ops",
    thesis: "Every webinar, podcast and conference talk a firm records becomes a newsletter, a set of posts, a landing page and a clip reel.",
    customer: "Professional services firms - consultancies, agencies, boutique banks - that produce good spoken content and publish almost none of it.",
    need: "These firms already record more expert content than they publish, and the partner who recorded it will never repurpose it. The raw material exists, the brand voice is established, and content budgets are growing - nearly half of B2B marketers expect them to rise in 2026.",
    competitors: ["Castmagic", "OpusClip", "Descript", "Jasper", "Traditional content agencies"],
    complexity: 1,
    complexityWhy: "Tooling is commoditized; you are selling the editorial judgment and the consistency, not the transcription.",
    capital: { total: 14000, lines: [
      { label: "Entity, insurance", amount: 3000 },
      { label: "Model, transcription and editing tools", amount: 4000 },
      { label: "Two accounts at cost", amount: 4000 },
      { label: "Runway reserve", amount: 3000 }
    ]},
    firstNinety: [
      "Take one firm's existing back catalogue and publish a month of content free. Show, do not pitch.",
      "Build a real voice guide per client before generating anything at volume.",
      "Retainer priced per source hour. Cap the number of clients so quality stays visibly high."
    ],
    claudeRole: "Voice-matched drafting from transcripts, editorial selection of what is worth publishing, and channel-specific formatting.",
    moat: "Weak technically. Compete on taste and on being narrow to one professional vertical.",
    sourceNotes: "Content Marketing Institute's 2026 B2B research: 46 percent of B2B marketers expect content budgets to rise."
  },
  {
    id: "insurance-agency-renewal",
    aiLeverage: 3, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 4, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Renewal Intelligence for Independent Insurance Agencies",
    category: "Vertical AI",
    thesis: "Pre-renewal analysis for commercial insurance books - coverage gaps, exposure changes, and the talking points the producer needs before the call.",
    customer: "Independent P&C agencies with 500-5,000 commercial accounts and producers who prep renewals the morning of.",
    need: "Renewal retention is the entire economics of an agency, and the difference between keeping and losing an account is often whether the producer noticed the client's exposure changed. The policy documents are structured, the prior year is on file, and the renewal date is known 12 months in advance.",
    competitors: ["Applied Systems (Applied Epic, Indio)", "Vertafore", "Broker Buddha (Acturis)", "Sixfold"],
    complexity: 3,
    complexityWhy: "Agency management system integrations are the real work, and carriers are conservative about data handling.",
    capital: { total: 44000, lines: [
      { label: "AMS integration development", amount: 15000 },
      { label: "Licensed insurance advisor on contract", amount: 12000 },
      { label: "Entity, E&O insurance", amount: 8000 },
      { label: "Runway reserve", amount: 9000 }
    ]},
    firstNinety: [
      "Work one agency's book by hand for a quarter. Learn which flags producers actually act on.",
      "Deliver as a one-page pre-renewal brief, not a dashboard. Producers do not log into things.",
      "Price per account under management per year, sold on retention-point improvement."
    ],
    claudeRole: "Policy comparison year over year, gap identification against the client's operations, and drafting the producer's call brief.",
    moat: "AMS integration depth plus measured retention improvement in one agency network.",
    sourceNotes: "Big I and Reagan Consulting Best Practices Study: top agencies renewed 92.9 to 97.7 percent of prior-year revenue."
  },
  {
    id: "translation-localization-niche",
    aiLeverage: 3, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 4, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Regulated-Document Localization for Mid-Market Exporters",
    category: "AI Services",
    thesis: "Translate and localize technical documentation, labels and manuals for companies entering two or three new markets, with a certified human review.",
    customer: "Manufacturers and device companies expanding into EU or LATAM markets who need documentation that survives a regulatory review.",
    need: "Machine translation is nearly free but regulatory documentation cannot be nearly right, so exporters overpay traditional agencies for work that is now mostly review rather than translation. The cost structure of the incumbent no longer matches the underlying labor.",
    competitors: ["RWS", "Lionbridge", "Smartling", "DeepL", "TransPerfect"],
    complexity: 3,
    complexityWhy: "The certification and reviewer network is the business; the translation itself is table stakes.",
    capital: { total: 36000, lines: [
      { label: "Certified reviewer network retainers", amount: 15000 },
      { label: "Entity, insurance, certification", amount: 8000 },
      { label: "Model and TMS tooling", amount: 6000 },
      { label: "Runway reserve", amount: 7000 }
    ]},
    firstNinety: [
      "Pick two language pairs and one regulatory regime. Do not be a general translation agency.",
      "Recruit three certified reviewers before taking a single client.",
      "Price per thousand words at roughly half the incumbent rate, with certification included."
    ],
    claudeRole: "First-pass translation, terminology consistency against the client's glossary, and preparing the reviewer's diff rather than raw text.",
    moat: "Certified reviewer relationships in a narrow regime plus an accumulated client terminology base.",
    sourceNotes: "EU MDR Article 10(11) sets device-information language requirements per member state; CSA Research tracks the shift away from per-word pricing."
  },
  {
    id: "municipal-records-request",
    aiLeverage: 3, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 3, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Public Records Request Processing for Local Government",
    category: "AI Ops",
    thesis: "Handle the intake, search, redaction review and response drafting for FOIA and state public-records requests at small agencies.",
    customer: "City clerks, small police departments and county offices facing statutory response deadlines with no dedicated records staff.",
    need: "Public records requests carry statutory deadlines and legal exposure, and volume has risen faster than staffing. Redaction review is the bottleneck, it is rule-based, and missing a deadline creates real liability for an agency that cannot hire its way out.",
    competitors: ["GovQA (Granicus)", "NextRequest (CivicPlus)", "JustFOIA", "Veritone Redact"],
    complexity: 4,
    complexityWhy: "A missed redaction is a serious incident, so a human must remain in the loop and you must document that they were.",
    capital: { total: 52000, lines: [
      { label: "Security and CJIS-adjacent compliance", amount: 16000 },
      { label: "Government attorney review of workflow", amount: 10000 },
      { label: "Infrastructure and model spend", amount: 10000 },
      { label: "Entity, insurance", amount: 7000 },
      { label: "Runway reserve", amount: 9000 }
    ]},
    firstNinety: [
      "Start with a non-law-enforcement agency. Police records raise the compliance bar sharply.",
      "Position the model as a redaction *proposer* with mandatory human confirmation. Never as the decision maker.",
      "Price per request processed, sold against their current deadline-compliance rate."
    ],
    claudeRole: "Responsive-document identification, proposing redactions against the statutory exemption list, and drafting the response letter with exemption citations.",
    moat: "One state's public-records statute fluency and a clean audit record.",
    sourceNotes: "State public records statutes and exemption lists are published. Federal FOIA requests passed 1.5 million in FY2024, and San Antonio alone handled 86,000 records requests in 2025."
  },
  {
    id: "franchise-compliance-audit",
    aiLeverage: 3, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 3, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Brand Standards Auditing for Franchisors",
    category: "AI Ops",
    thesis: "Review franchisee-submitted photos, local marketing and site documentation against the brand standards manual, at scale.",
    customer: "Franchisors with 50-1,000 units whose field consultants can only visit each location a few times a year.",
    need: "Brand standards enforcement is the franchisor's core obligation and it is done by too few people traveling too much. Franchisees already submit photos and marketing for approval. The standards manual is the rulebook and it is written down.",
    competitors: ["FranConnect", "Naranga", "Zenput (CrunchTime)", "Mitti (formerly SafetyCulture)"],
    complexity: 3,
    complexityWhy: "Image evaluation is workable but the franchisor relationship is political - you are automating enforcement.",
    capital: { total: 33000, lines: [
      { label: "Vision model and infrastructure spend", amount: 12000 },
      { label: "Entity, insurance", amount: 5000 },
      { label: "One franchisor pilot at cost", amount: 9000 },
      { label: "Runway reserve", amount: 7000 }
    ]},
    firstNinety: [
      "Pilot with one franchisor on one standards category - signage, or uniform, or food presentation.",
      "Report to the field consultant, not to the franchisee. You augment the human, you do not replace them.",
      "Price per unit per month. Sell on field-visit coverage, not on cost reduction."
    ],
    claudeRole: "Photo-to-standard comparison, drafting the corrective-action notice in brand voice, and trend reporting across units.",
    moat: "The standards manual encoded per brand, which becomes switching cost once it is tuned.",
    sourceNotes: "IFA forecasts about 845,000 U.S. franchise establishments in 2026."
  },
  {
    id: "ag-input-agronomy",
    aiLeverage: 3, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 4, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Input Cost and Agronomy Review for Row Crop Farms",
    category: "Physical + AI",
    thesis: "Season-by-season review of seed, fertilizer and chemical purchases against agronomic need and local trial data.",
    customer: "Independent row-crop operations of 1,000-10,000 acres who buy inputs from a retailer that also advises them.",
    need: "The person recommending the inputs is usually the person selling them, and farmers know it. Land-grant university trial data and soil test results are public and objective, but nobody sits between the farmer and the retailer with an independent read. Fertilizer alone ran 33 to 44 percent of corn operating costs from 2010 to 2019.",
    competitors: ["Farmers Business Network", "Granular Insights (Corteva)", "AgriEdge Excelsior (Syngenta)", "Independent crop consultants"],
    complexity: 3,
    complexityWhy: "Agronomy is real expertise and the trust cycle is a full growing season long.",
    capital: { total: 41000, lines: [
      { label: "Certified crop adviser on contract", amount: 18000 },
      { label: "Soil testing and data acquisition", amount: 9000 },
      { label: "Entity, insurance", amount: 5000 },
      { label: "Runway reserve", amount: 9000 }
    ]},
    firstNinety: [
      "Partner with a certified crop adviser from day one. Do not attempt this on model output alone.",
      "Review one season for five farms free. Compare your recommendation to what the retailer sold them.",
      "Price per acre annually. Sell in winter, when the next season's inputs are being booked."
    ],
    claudeRole: "Synthesizing university extension trial data against a farm's soil tests and history, and writing the plain-language recommendation.",
    moat: "Independence itself, plus a local yield-outcome record that accumulates one season at a time.",
    sourceNotes: "Land-grant extension services publish variety trial data; USDA ERS publishes cost-of-production data by input."
  },
  {
    id: "credentialing-service",
    aiLeverage: 3, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 4, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Provider Credentialing and Payer Enrollment",
    category: "AI Ops",
    thesis: "Get clinicians credentialed and enrolled with payers faster, tracking every application through a notoriously opaque process.",
    customer: "Growing practices, telehealth groups and locums agencies adding providers who cannot bill until enrollment clears.",
    need: "Every day a provider is not credentialed is a day of unbillable revenue, and the process is a months-long document chase across a dozen payers with no visibility. It is form-filling and follow-up at scale, with a directly quantifiable cost of delay.",
    competitors: ["Medallion", "Verifiable", "CAQH Provider Data Portal (DataSpring)", "Symplr", "Credentialing outsourcers"],
    complexity: 3,
    complexityWhy: "Well-funded competition exists, but the market is enormous and the incumbents ignore small groups.",
    capital: { total: 37000, lines: [
      { label: "HIPAA and data handling controls", amount: 11000 },
      { label: "Experienced credentialing specialist, part time", amount: 14000 },
      { label: "Entity, insurance", amount: 5000 },
      { label: "Runway reserve", amount: 7000 }
    ]},
    firstNinety: [
      "Hire or partner with someone who has done credentialing manually for years. The knowledge is not documented anywhere.",
      "Serve one specialty in one state. Payer requirements vary enough that breadth kills you early.",
      "Price per provider enrolled, with a days-to-approval guarantee once you know your real number."
    ],
    claudeRole: "Application population from provider documents, requirement diffing across payers, and drafting the follow-up correspondence that unsticks stalled applications.",
    moat: "Payer-specific timelines and contact knowledge, which is genuinely tribal and genuinely valuable.",
    sourceNotes: "MGMA: 32 percent of medical groups report credentialing backlogs, and commercial payers can take up to 100 days to set an effective date."
  },
  {
    id: "trade-school-admissions",
    aiLeverage: 3, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 3, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Enrollment Operations for Trade and Vocational Schools",
    category: "AI Ops",
    thesis: "Run inquiry-to-enrollment follow-up for trade schools - response speed, document collection, financial aid chase, start-date confirmation.",
    customer: "Welding, HVAC, CDL, cosmetology and allied-health schools with 100-2,000 students and a two-person admissions office.",
    need: "These schools lose enrolled-intent students to slow follow-up and incomplete paperwork, not to competitors. Speed to first response is the dominant variable, and the follow-up sequence is repetitive and time-bound. Every recovered student is several thousand dollars of tuition.",
    competitors: ["Element451", "Slate (Technolutions)", "Salesforce Education Cloud", "In-house admissions staff"],
    complexity: 2,
    complexityWhy: "Straightforward operationally, but be careful - this sector has real regulatory scrutiny around recruiting practices.",
    capital: { total: 23000, lines: [
      { label: "Entity, insurance, compliance review", amount: 7000 },
      { label: "Communications infrastructure and tooling", amount: 6000 },
      { label: "Two schools at cost", amount: 6000 },
      { label: "Runway reserve", amount: 4000 }
    ]},
    firstNinety: [
      "Read the Title IV incentive-compensation rules before pricing anything. Do not price per enrollment.",
      "Instrument one school's current inquiry-to-start conversion. That baseline is your proof.",
      "Flat monthly retainer. Sell on melt reduction, and stay clearly on the right side of the recruiting rules."
    ],
    claudeRole: "Drafting personalized follow-up sequences, document-completeness checking, and flagging which students are actually at risk of melting.",
    moat: "Conversion-lift proof in one school category plus association referrals.",
    sourceNotes: "IPEDS publishes completion and enrollment data; Title IV incentive compensation rules are in 34 CFR 668.14."
  },
  {
    id: "warranty-claims-recovery",
    aiLeverage: 4, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 3, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Warranty and Rebate Recovery for Equipment-Heavy Businesses",
    category: "Data Products",
    thesis: "Find and file the warranty claims, manufacturer rebates and service credits that fleet and equipment owners never claim.",
    customer: "Trucking fleets, landscaping companies, equipment rental yards and property managers with heavy repair spend.",
    need: "Repairs get paid out of pocket that a warranty or a rebate program would have covered, because matching a repair invoice to a coverage term requires reading both. That is a document-matching problem with cash on the other side, and the client risks nothing under contingency pricing.",
    competitors: ["Fleetio", "Dossier (now AMCS Fleet Maintenance)", "Warranty recovery contingency firms", "OEM dealer service departments"],
    complexity: 2,
    complexityWhy: "Contingency pricing makes selling easy; the work is document access and OEM claim procedure.",
    capital: { total: 20000, lines: [
      { label: "Entity, insurance", amount: 4000 },
      { label: "Model and OCR infrastructure", amount: 6000 },
      { label: "Working capital during recovery lag", amount: 7000 },
      { label: "Runway reserve", amount: 3000 }
    ]},
    firstNinety: [
      "Pick one equipment category. OEM warranty terms and claim procedures do not transfer across categories.",
      "Audit one fleet's last two years of repair invoices free. The recovery number sells the next ten clients.",
      "Take a percentage of recovered dollars. Sign the claim-filing authority up front."
    ],
    claudeRole: "Matching repair line items to warranty coverage terms and rebate program rules, then assembling the claim package.",
    moat: "OEM claim-procedure knowledge per equipment category and a recovery track record.",
    sourceNotes: "OEM warranty terms are published in owner documentation; ATRI's Operational Costs of Trucking puts repair and maintenance at 21.5 cents a mile in 2025."
  },
  {
    id: "church-nonprofit-media",
    aiLeverage: 4, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 1, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Weekly Media Operations for Congregations and Community Orgs",
    category: "AI Ops",
    thesis: "Turn one weekly recorded gathering into the podcast, the newsletter, the social clips, the archive page and the accessibility transcript.",
    customer: "Congregations, community centers and civic organizations of 200-2,000 members with a volunteer running media badly.",
    need: "These organizations produce a full hour of original recorded content every single week and publish almost none of it usefully. The volunteer who owns it is burning out. The budget exists, it is small, and it is annual and predictable.",
    competitors: ["Subsplash", "Tithe.ly", "Buzzsprout", "Volunteer media teams", "Local video freelancers"],
    complexity: 1,
    complexityWhy: "Repeatable weekly pipeline, no regulated data, extremely high tolerance for a scrappy start.",
    capital: { total: 9000, lines: [
      { label: "Entity, insurance", amount: 2500 },
      { label: "Pipeline tooling and model spend", amount: 3000 },
      { label: "Two organizations at cost", amount: 2000 },
      { label: "Runway reserve", amount: 1500 }
    ]},
    firstNinety: [
      "Build the pipeline once against one organization. Every subsequent client is a config change.",
      "Price low, monthly, per organization, and keep the per-client labor near zero.",
      "Grow entirely by referral within one denomination or network. They share vendors freely."
    ],
    claudeRole: "Summarization, newsletter drafting in the organization's voice, clip selection, and accessibility transcript cleanup.",
    moat: "Per-client marginal cost near zero plus a dense referral network. Volume business, thin per unit.",
    sourceNotes: "Faith Communities Today (2020): median weekly attendance is 65, and only about 10 percent of congregations draw more than 250 - the target segment is small."
  },
  {
    id: "vendor-security-questionnaire",
    aiLeverage: 4, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 4, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Security Questionnaire Response Service for B2B Vendors",
    category: "AI Ops",
    thesis: "Answer the security and procurement questionnaires that stall enterprise deals, from a maintained evidence library.",
    customer: "Series A to C B2B software companies whose deals stall for weeks in vendor security review.",
    need: "A stalled security questionnaire is a stalled deal with a revenue number attached, and it lands on an engineer or a founder who has no time for it. The questions repeat heavily across customers, and the answers derive from a policy set the company already has.",
    competitors: ["Vanta", "Drata (acquired SafeBase in 2025)", "Conveyor", "Whistic"],
    complexity: 2,
    complexityWhy: "Crowded category, but the incumbents sell software while many companies want the work simply done for them.",
    capital: { total: 25000, lines: [
      { label: "Security credential and training", amount: 8000 },
      { label: "Entity, E&O insurance", amount: 6000 },
      { label: "Model and infrastructure spend", amount: 5000 },
      { label: "Runway reserve", amount: 6000 }
    ]},
    firstNinety: [
      "Build the evidence library structure once. It is the actual asset - the questionnaires are just queries against it.",
      "Serve three companies at cost and measure days-to-completed-questionnaire.",
      "Retainer plus per-questionnaire pricing. Sell to the founder, who feels the stalled deal personally."
    ],
    claudeRole: "Mapping incoming questions to the maintained evidence library, drafting answers with the right caveats, and flagging genuine gaps for remediation.",
    moat: "The client's own maintained evidence library, which makes switching painful and renewals automatic.",
    sourceNotes: "Vanta's State of Trust research: security teams spend about 7 hours a week on vendor security assessments."
  },
  {
    id: "local-govt-agenda-digest",
    aiLeverage: 3, // 1-5, how much of the work is genuinely LLM-native
    defensibility: 2, // 1-5, honest read of the "moat" field above
    opportunityType: "build", // "build" | "buy" | "invest" - all pool entries are build-it-yourself by design
    title: "Local Government Intelligence for Regional Businesses",
    category: "Data Products",
    thesis: "Monitor every city council, planning commission and school board agenda in a metro and alert clients to items that affect them.",
    customer: "Developers, contractors, hospital systems, regional banks and trade associations with a stake in local decisions.",
    need: "Local government decisions carry real commercial consequences and are announced in public documents almost nobody reads. National platforms and lobbying firms cover this for large clients. The documents are public, published on a schedule, and machine-readable enough.",
    competitors: ["FiscalNote (owns Curate)", "Polco", "Municode (CivicPlus)", "Local lobbying and government affairs firms"],
    complexity: 3,
    complexityWhy: "Ingestion across dozens of inconsistent municipal websites is unglamorous, ongoing engineering work.",
    capital: { total: 32000, lines: [
      { label: "Ingestion infrastructure and model spend", amount: 13000 },
      { label: "Entity, insurance", amount: 4000 },
      { label: "Design partner discount period", amount: 8000 },
      { label: "Runway reserve", amount: 7000 }
    ]},
    firstNinety: [
      "Cover one metro completely. Partial coverage is worthless - clients need to trust they will not miss something.",
      "Deliver a daily email brief. Nobody wants another dashboard login.",
      "Price per seat per month to five design partners in different industries before broadening."
    ],
    claudeRole: "Reading every agenda and packet, classifying items by client interest profile, and writing the two-sentence why-this-matters note.",
    moat: "Thin. FiscalNote's Curate already ingests meeting documents from 12,000+ municipalities. The defensible piece is judgment about what matters to one industry in one metro, and the relationships that come with it.",
    sourceNotes: "Municipal agendas and packets are public record; FiscalNote, which owns Curate, monitors 12,000+ municipalities and establishes the category."
  },

  // ---- Drafts added 2026-09-27 to diversify the pool (buy-type and consumer
  // product ideas). verification.js marks them needs-review: they are never
  // selected until the owner approves them.
  {
    id: "buy-ai-bookkeeping-practice",
    aiLeverage: 4,
    defensibility: 3,
    opportunityType: "buy",
    title: "Buy a Small Bookkeeping and Tax Practice, Then Rebuild It Around AI",
    category: "AI Services",
    thesis: "Buy an owner-run bookkeeping and tax practice with an SBA loan, keep its clients, and use AI to cut the hours each client takes so the same staff can serve more of them.",
    customer: "The practice's existing small-business and individual clients, who already pay monthly bookkeeping and annual tax fees.",
    need: "Accounting practices change hands every year - BizBuySell reports a median sale price of about $500,000 for accounting and tax practices in 2025, at about 1.1 times revenue. An SBA 7(a) loan requires the buyer to put in at least 10 percent of the project cost as equity. The client base is recurring revenue; what AI changes is the hours behind it.",
    competitors: ["Crete Professionals Alliance", "Pilot", "Private equity accounting roll-ups", "Search fund buyers"],
    complexity: 4,
    complexityWhy: "You run a professional practice with debt service, client retention risk and staff you did not hire from day one - and it must be a non-attest practice, because audit, review and compilation work requires a CPA-majority-owned firm.",
    capital: { total: 100000, lines: [
      { label: "SBA equity injection (10 percent of about a $460k project)", amount: 46000 },
      { label: "Quality-of-earnings review and deal attorney", amount: 18000 },
      { label: "Working capital beyond the loan", amount: 14000 },
      { label: "AI tooling and data migration, year one", amount: 8000 },
      { label: "Runway reserve", amount: 14000 }
    ]},
    firstNinety: [
      "Before signing: get a quality-of-earnings review, three years of client retention, and a seller transition agreement that covers the next tax season. Tie part of the price to clients retained.",
      "After closing: change nothing clients can see. Time every recurring task and put AI on the three most repetitive ones - categorization, reconciliations, workpaper prep.",
      "Measure hours per client before and after. Take on new clients with the freed capacity only after retention through the first tax season is proven."
    ],
    claudeRole: "Transaction categorization review, reconciliation exception notes, workpaper and memo drafting, client emails, and writing down the seller's know-how before they leave.",
    moat: "The acquired client relationships and the seller's referral network. The AI workflow is copyable; a book of local clients that trusts you is not.",
    sourceNotes: "BizBuySell accounting-practice benchmarks (median price about $500,000 in 2025, 1.11 times revenue); SBA SOP 50 10 8 (10 percent equity injection for a change of ownership). Crete Professionals Alliance is running the same playbook with Thrive Capital money."
  },
  {
    id: "buy-ai-property-management-firm",
    aiLeverage: 3,
    defensibility: 3,
    opportunityType: "buy",
    title: "Buy a Small Residential Property Management Firm and Automate Its Back Office",
    category: "Vertical AI",
    thesis: "Buy an owner-run property management company with a few hundred rental homes under contract, keep its owners and tenants, and run leasing, maintenance and owner reporting with AI so each door takes fewer hours.",
    customer: "Rental property owners who already pay the firm a monthly management fee, and the tenants it serves on their behalf.",
    need: "Owner-run property managers sell regularly - BizBuySell puts the median revenue multiple at about 0.69, with a median asking price in the high $200,000s and median revenue of about $437,667. National roll-ups are buying local managers too: Evernest has made more than 30 acquisitions, including one in St. Louis.",
    competitors: ["Evernest", "AppFolio", "Buildium (RealPage)", "Local property management firms"],
    complexity: 4,
    complexityWhy: "Trust accounting, fair-housing and landlord-tenant law apply from the first day, and most states treat managing rentals for others as licensed real estate activity - confirm the license and trust-account rules in your state before you close.",
    capital: { total: 100000, lines: [
      { label: "SBA equity injection (10 percent of about a $330k project)", amount: 33000 },
      { label: "Quality of earnings, attorney, license and trust-account setup", amount: 16000 },
      { label: "Working capital beyond the loan", amount: 20000 },
      { label: "AI tooling and system migration", amount: 9000 },
      { label: "Runway reserve", amount: 22000 }
    ]},
    firstNinety: [
      "Before signing: audit the trust account, whether the management agreements can be assigned, and door churn for the last three years. Tie part of the price to doors retained.",
      "After closing: keep the staff and everything owners see. Put AI on maintenance intake, leasing inquiries and the monthly owner statement narrative first.",
      "Measure hours per door and owner churn. Only then offer the lower-cost structure to new owners."
    ],
    claudeRole: "Tenant inquiry and maintenance request triage, notice and lease drafting from approved templates, monthly owner statement narratives, and documenting the seller's processes before they leave.",
    moat: "The acquired management agreements and the local vendor network. Doors leave when service slips, so the moat is retention, not software.",
    sourceNotes: "BizBuySell property-management benchmarks (median revenue multiple 0.69, median revenue about $437,667); Evernest's acquisition of St. Louis Property Management. State licensing summaries note most states require a real estate license to manage property for others."
  },
  {
    id: "patient-appeal-app",
    aiLeverage: 4,
    defensibility: 1,
    opportunityType: "build",
    title: "Self-Serve Insurance Appeal Builder for Patients",
    category: "Consumer AI",
    thesis: "A web app that walks a patient through appealing a denied health claim - the denial reason, the plan's own policy language, the deadlines - and produces the letter and the submission checklist, for a flat fee per appeal.",
    customer: "Patients and caregivers with a denied claim, starting with ACA marketplace plan members, where denials are frequent and appeals are rare.",
    need: "KFF found that HealthCare.gov marketplace insurers denied 19 percent of in-network claims in 2024, and consumers appealed less than 1 percent of them. Of the denials that were appealed, insurers upheld 66 percent - so about a third were not upheld.",
    competitors: ["Claimable", "Counterforce Health", "Patient and medical billing advocates"],
    complexity: 3,
    complexityWhy: "Every plan and condition differs, and a missed deadline or missing document can forfeit an appeal - the product has to get the procedure exactly right without practicing law or medicine.",
    capital: { total: 70000, lines: [
      { label: "Product build and model spend", amount: 18000 },
      { label: "Legal review of scope and disclaimers", amount: 12000 },
      { label: "Privacy and security controls", amount: 10000 },
      { label: "Acquisition tests in one patient community", amount: 15000 },
      { label: "Runway reserve", amount: 15000 }
    ]},
    firstNinety: [
      "Pick one denial type in marketplace plans. Walk 30 patients through appeals by hand and write down every step and deadline.",
      "Turn those steps into the app. Charge per appeal, and publish your overturn rate once there are enough appeals to make it honest.",
      "Test one channel - a patient community for a single condition - before spending on broad ads."
    ],
    claudeRole: "Reading the denial letter and plan documents, matching the denial reason to the policy language, drafting the appeal letter, and building the deadline and document checklist.",
    moat: "Thin. Counterforce Health gives this away free and Claimable charges about $40 an appeal. A paid product needs a narrower wedge - one condition or denial type - and a published overturn record.",
    sourceNotes: "KFF analysis of 2024 HealthCare.gov marketplace claims: 19 percent in-network denial rate, under 1 percent appealed, 66 percent of appealed denials upheld."
  }
];

export function ideaById(id) {
  return IDEAS.find((i) => i.id === id) || null;
}

// Sanity check the capital math at module load - a bad line-item sum would
// otherwise render a broken ledger bar on the site with no error anywhere.
for (const idea of IDEAS) {
  const sum = idea.capital.lines.reduce((a, l) => a + l.amount, 0);
  if (sum !== idea.capital.total) {
    throw new Error(`capital lines do not sum to total for "${idea.id}": ${sum} vs ${idea.capital.total}`);
  }
  if (idea.capital.total > 100000) {
    throw new Error(`capital total exceeds the 100k ceiling for "${idea.id}"`);
  }
  if (idea.firstNinety.length !== 3) {
    throw new Error(`firstNinety must have exactly 3 phases for "${idea.id}"`);
  }
  if (!Number.isInteger(idea.aiLeverage) || idea.aiLeverage < 1 || idea.aiLeverage > 5) {
    throw new Error(`aiLeverage must be an integer 1-5 for "${idea.id}"`);
  }
  if (!Number.isInteger(idea.defensibility) || idea.defensibility < 1 || idea.defensibility > 5) {
    throw new Error(`defensibility must be an integer 1-5 for "${idea.id}"`);
  }
  if (!["build", "buy", "invest"].includes(idea.opportunityType)) {
    throw new Error(`opportunityType must be build/buy/invest for "${idea.id}"`);
  }
}
