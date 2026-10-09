// verification.js
// The audit trail behind every entry in ideas-source.js. An idea without a
// record here fails the build (scripts/selftest.mjs), and an idea whose
// record is not "verified" is never selected (selection.js).
//
// ASCII ONLY, same rule as ideas-source.js.
//
// What "verified" means - and what it does not - is published on
// /method.html. In short:
//   - every named competitor was checked live on lastVerified: it exists,
//     it does roughly what the brief says, and its ownership is current
//   - every number, superlative or named-source attribution in the entry
//     either links to a source below or was removed
//   - capital figures and the complexity / aiLeverage / defensibility
//     ratings are editorial estimates. They are NOT verified.
//
// Record shape:
//   status       "verified" | "needs-review" | "held"
//   lastVerified "YYYY-MM-DD"
//   competitors  [{ name, url, kind, overlap, note }] - name matches the
//                idea's competitors[] entry exactly
//                kind:    public | funded | established | services | category
//                overlap: direct (same outcome, same buyer) | adjacent
//   sources      [{ claim, url, publisher }] - what each link supports
//   changes      what this pass changed in the pool entry
//   openItems    what must be resolved before a held idea can run
//   corrections  [{ date, text }] - notes shown on already-published
//                episodes whose audio or page carried a claim that failed
//                verification

const C = (name, url, kind, overlap, note) => ({ name, url, kind, overlap, note });
const S = (claim, url, publisher) => ({ claim, url, publisher });

export const VERIFIED_ON = "2026-09-26";

export const VERIFICATION = {
  "rfp-response-shop": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("Deltek GovWin IQ", "https://www.deltek.com/en/government-contracting/govwin", "established", "adjacent", "Opportunity intelligence backed by 150+ analysts. Finds bids; does not write them."),
      C("Unanet ProposalAI", "https://unanet.com/proposal-ai", "established", "direct", "AI proposal drafting built for government contractors."),
      C("AutogenAI", "https://autogenai.com/", "funded", "direct", "AI bid and proposal writing. $39.5M Series B, $65.3M raised in total."),
      C("Rohirrim", "https://rohirrim.ai/", "funded", "direct", "RohanRFP drafts compliant proposal responses. Backed by Bessemer and IBM Ventures."),
      C("Shipley Associates (traditional consulting)", "https://www.shipleywins.com/", "services", "direct", "The long-standing proposal training and consulting firm.")
    ],
    sources: [
      S("AutogenAI raised a $39.5M Series B ($65.3M total)", "https://autogenai.com/apac/blog/salesforce-ventures-co-lead-a-39-5m-investment-round-in-autogenais-game-changing-proposal-writing-software/", "AutogenAI"),
      S("Rohirrim is venture-backed (Bessemer, IBM Ventures)", "https://www.prnewswire.com/news-releases/bessemer-venture-partners-and-ibm-ventures-invest-in-rohirrim-leader-in-rfp-ai-automation-302193531.html", "PR Newswire"),
      S("APMP-certified proposal managers earn roughly $71k-$143k", "https://www.payscale.com/research/US/Certification=Association_of_Proposal_Management_(APMP)_Certification/Salary", "Payscale")
    ],
    changes: [
      "Cut the $150-$250 hourly consultant rate - no source found.",
      "Cut 'the highest-priced writing labor in the country' - unsupported superlative."
    ],
    openItems: [],
    corrections: [
      { date: "2026-09-07", text: "The audio said hourly rates in this market run one hundred and fifty to two hundred and fifty dollars. That figure came from unsourced pool material and has been removed. The labor-cost baseline now rests on published proposal-manager salary data." }
    ]
  },

  "claims-denial-appeals": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("Waystar", "https://www.waystar.com/our-platform/denial-prevention-recovery/denial-appeal-management/", "public", "direct", "Public (Nasdaq: WAY). Generative-AI appeal letters from 1,100+ payer-specific templates; sells to physician practices as well as health systems."),
      C("Availity", "https://www.availity.com/denial-prevention-and-management/", "established", "adjacent", "All-payer clearinghouse with denial prevention and management tools."),
      C("Infinitus", "https://www.infinitus.ai/", "funded", "adjacent", "AI voice agents for payer calls and benefit verification, founded 2019. Not an appeals service."),
      C("Adonis", "https://adonis.io/", "funded", "direct", "AI revenue-cycle orchestration that detects and works denials. $40M Series C in March 2026, over $95M raised."),
      C("Candid Health", "https://www.candidhealth.com/", "funded", "adjacent", "Claims and billing automation. $120M Series D in July 2026.")
    ],
    sources: [
      S("Up to 65 percent of denied claims are never resubmitted", "https://www.hfma.org/revenue-cycle/denials-management/61778/", "HFMA"),
      S("12 percent of claims were denied on initial submission in 2022", "https://www.hfma.org/wp-content/uploads/2023/05/actionableinsightsstrategies-txstateconf2023.pdf", "Change Healthcare Denials Index, via HFMA"),
      S("Adonis raised a $40M Series C", "https://adonis.io/resources/adonis-raises-40m-series-c-to-equip-healthcare-providers-with-ai-driven-revenue-cycle-operations", "Adonis"),
      S("Candid Health raised a $120M Series D", "https://www.fiercehealthcare.com/health-tech/candid-health-secures-120m-series-d-funding-ai-powered-rcm-ramps", "Fierce Healthcare")
    ],
    changes: [
      "Replaced the KFF citation. KFF's marketplace data measures patients appealing their own denials, not what clinics do. Provider-side denial data from HFMA and the Change Healthcare index now supports the claim.",
      "Removed the unsourced causal claim that unappealed denials would have succeeded."
    ],
    openItems: [],
    corrections: [
      { date: "2026-08-29", text: "The audio said KFF and CMS data confirm that a meaningful share of denied claims are never appealed because of the labor cost. KFF's data describes patients appealing their own denials, not clinics, and it does not show why claims go unappealed. The supported claim: HFMA reports up to 65 percent of denied claims are never resubmitted." }
    ]
  },

  "permit-expediter": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("PermitFlow", "https://www.permitflow.com/", "funded", "direct", "AI permitting platform. $54M Series B led by Accel, December 2025."),
      C("Pulley", "https://www.withpulley.com/", "funded", "direct", "Permit specialists plus software covering 19,000 jurisdiction portals. $4.4M seed, 2022."),
      C("GreenLite", "https://greenlite.com/", "funded", "adjacent", "AI-assisted private plan review. $49.5M Series B led by Insight Partners."),
      C("Local expediting firms (fragmented, offline)", "", "category", "direct", "Unnamed local expediters.")
    ],
    sources: [
      S("PermitFlow raised a $54M Series B", "https://www.businesswire.com/news/home/20251202551013/en/PermitFlow-Raises-$54-Million-to-Solve-Constructions-Biggest-Bottlenecks-With-AI", "Business Wire"),
      S("Pulley raised a $4.4M seed round", "https://techcrunch.com/2022/06/02/pulley-raises-4-4m-seed-to-shorten-the-construction-permitting-process-from-months-to-days-with-its-software/", "TechCrunch"),
      S("GreenLite raised a $49.5M Series B", "https://www.prnewswire.com/news-releases/greenlite-raises-49-5m-series-b-to-advance-the-privatization-of-construction-permitting-with-ai-powered-solutions-302555315.html", "PR Newswire"),
      S("Model building codes are published", "https://codes.iccsafe.org/", "International Code Council")
    ],
    changes: [
      "Cut 'the single most common schedule killer on a residential remodel' - unsupported superlative."
    ],
    openItems: [],
    corrections: []
  },

  "board-packet-service": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("BoardEffect (Diligent)", "https://www.diligent.com/products/boardeffect", "established", "adjacent", "Diligent's nonprofit board portal. Software, not packet production."),
      C("Boardable", "https://boardable.com/", "established", "adjacent", "Nonprofit board software with a published rate card."),
      C("OnBoard", "https://www.onboardmeetings.com/", "established", "adjacent", "Board portal; nonprofit discount requires a three-year term."),
      C("Fractional nonprofit bookkeepers and CFO firms", "", "category", "direct", "Where a nonprofit buys the financial narrative today.")
    ],
    sources: [
      S("92 percent of nonprofits run on under $1M a year; 97 percent under $5M", "https://www.councilofnonprofits.org/files/media/documents/2025/ncn-about-the-nonprofit-sector-2025.pdf", "National Council of Nonprofits"),
      S("Diligent Community serves public-sector boards, not nonprofits", "https://www.diligent.com/products/community", "Diligent")
    ],
    changes: [
      "Removed Diligent Community. It serves school boards and local governments; Diligent's nonprofit product is BoardEffect.",
      "Added fractional bookkeepers and CFO firms, the real substitute for this service.",
      "Replaced the vague Candid citation with National Council of Nonprofits data. Note: the $1M-$20M budget target is a narrow slice of the sector."
    ],
    openItems: [],
    corrections: []
  },

  "spec-to-takeoff": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("Togal.AI", "https://www.togal.ai/", "funded", "direct", "AI takeoff software. About $22.65M raised."),
      C("Beam AI", "https://www.ibeam.ai/", "established", "direct", "Done-for-you AI takeoff with expert review, delivered in 24-72 hours across most trades. The closest match to this service."),
      C("Trunk Tools", "https://trunktools.com/", "funded", "adjacent", "AI over project documents. $40M Series B, July 2025. Not a takeoff product."),
      C("STACK", "https://www.stackct.com/takeoff-and-estimating/", "established", "direct", "Cloud takeoff and estimating built for subcontractors."),
      C("Procore Estimating", "https://www.procore.com/estimating", "public", "direct", "Procore (NYSE: PCOR) takeoff and estimating with automated area takeoff.")
    ],
    sources: [
      S("Togal.AI raised $5M pre-Series A", "https://www.constructiondive.com/news/togalai-raises-5m/646254/", "Construction Dive"),
      S("Trunk Tools raised a $40M Series B", "https://www.insightpartners.com/ideas/trunk-tools-closes-40m-series-b-to-lead-constructions-ai-transformation/", "Insight Partners"),
      S("CFMA's Benchmarker publishes contractor financial ratios (45.5 percent of respondents are subcontractors)", "https://cfma.org/benchmarker", "CFMA")
    ],
    changes: [
      "Corrected the CFMA attribution. CFMA's Benchmarker publishes financial ratios, not subcontractor bid-hit rates.",
      "Softened 'they pass on bids they would win' to a claim about estimator capacity."
    ],
    openItems: [],
    corrections: [
      { date: "2026-09-02", text: "The audio said CFMA data on subcontractor bid-hit rates confirms that subs pass on bids when estimator capacity runs out. CFMA does not publish bid-hit rates; its Benchmarker covers financial ratios. That claim should not have been made." }
    ]
  },

  "lease-abstract": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("VTS", "https://www.vts.com/", "established", "adjacent", "Commercial leasing and asset-management platform."),
      C("Prophia", "https://www.prophia.com/lease-abstraction", "established", "direct", "AI lease abstraction; reports nearly 150,000 lease documents processed."),
      C("FinQuery (formerly LeaseQuery)", "https://finquery.com/", "established", "adjacent", "Lease accounting and contract management. Renamed from LeaseQuery in February 2024."),
      C("Visual Lease", "https://visuallease.com/", "established", "adjacent", "Lease management and ASC 842 / GASB 87 accounting, with critical-date tracking."),
      C("Yardi", "https://www.yardi.com/", "established", "adjacent", "Property management and accounting system of record.")
    ],
    sources: [
      S("LeaseQuery rebranded as FinQuery in February 2024", "https://finquery.com/press-releases/leasequery-rebrands-to-finquery/", "FinQuery"),
      S("ASC 842 brought operating leases onto the balance sheet", "https://www.fasb.org/Page/PageContent?pageId=/projects/recentlycompleted/leases-post-issuance-summary.html", "FASB")
    ],
    changes: [
      "Removed the claim that FinQuery and Visual Lease publish lease-administration error research - no such research was found.",
      "Softened 'usually exceeds the annual fee' to 'can exceed the annual fee'."
    ],
    openItems: [],
    corrections: [
      { date: "2026-08-31", text: "The audio said FinQuery and Visual Lease have published research documenting the scale of lease-administration error. No such research was found; the claim came from an unverified sourcing note." }
    ]
  },

  "grant-compliance-reporting": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("Euna Grants (eCivis and AmpliFund)", "https://eunasolutions.com/", "established", "direct", "eCivis and AmpliFund are both Euna Solutions brands - one company, previously listed twice."),
      C("Submittable", "https://www.submittable.com/solutions/grants-management-software-for-government", "established", "adjacent", "Grant software built mainly for grantmakers, not grant recipients."),
      C("Local grant consultants", "", "category", "direct", "Independent grant writers and compliance consultants.")
    ],
    sources: [
      S("Capacity limits keep grant recipients from accessing and managing federal grants", "https://www.gao.gov/products/gao-23-106797", "GAO (GAO-23-106797)"),
      S("Noncompliance can lead to disallowed costs and other remedies", "https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200/subpart-D/subject-group-ECFR86b76dde0e1e9dc/section-200.339", "2 CFR 200.339"),
      S("eCivis and AmpliFund are both Euna Solutions platforms", "https://eunasolutions.com/resources/euna-aquires-grant-exec-ai-grants-discovery/", "Euna Solutions")
    ],
    changes: [
      "Merged eCivis and AmpliFund into one entry - same parent company.",
      "Softened 'routinely leave money undrawn' to the capacity gap GAO actually documents."
    ],
    openItems: [],
    corrections: [
      { date: "2026-08-27", text: "The audio treated eCivis and AmpliFund as separate competitors; both are owned by Euna Solutions. It also said most small municipalities miss draws because nobody has capacity for the paperwork. GAO documents capacity gaps, but not that most municipalities miss draws." }
    ]
  },

  "shopify-catalog-ops": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("Akeneo", "https://www.akeneo.com/akeneo-pim/", "established", "adjacent", "Product information management software."),
      C("Salsify", "https://www.salsify.com/", "established", "adjacent", "Product experience management software."),
      C("Productsup", "https://www.productsup.com/", "funded", "direct", "Feed management and syndication; raised $70M; 900+ brands."),
      C("Feedonomics (Commerce, formerly BigCommerce)", "https://feedonomics.com/", "public", "direct", "Full-service feed management. Parent renamed Commerce.com, Inc. (Nasdaq: CMRC) in July 2025."),
      C("Jasper", "https://www.jasper.ai/", "established", "adjacent", "AI marketing content platform.")
    ],
    sources: [
      S("54 percent of shoppers abandoned a sale over inconsistent product content across channels", "https://www.salsify.com/resources/report/2025-consumer-research", "Salsify 2025 Consumer Research"),
      S("BigCommerce renamed its parent company Commerce in July 2025", "https://www.globenewswire.com/news-release/2025/07/31/3124765/0/en/Introducing-Commerce-the-New-Parent-Brand-of-BigCommerce-Feedonomics-and-Makeswift-Powering-an-AI-Driven-Future.html", "GlobeNewswire")
    ],
    changes: [
      "Updated Feedonomics' parent: BigCommerce Holdings became Commerce.com, Inc. in July 2025."
    ],
    openItems: [],
    corrections: [
      { date: "2026-08-26", text: "The audio said Feedonomics is 'now under BigCommerce'. Its parent company renamed itself Commerce (Commerce.com, Inc.) in July 2025." }
    ]
  },

  "clinical-trial-feasibility": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("Medidata", "https://www.medidata.com/", "public", "adjacent", "Dassault Systemes' sponsor-side clinical trial platform."),
      C("Veeva SiteVault", "https://www.veeva.com/products/veeva-sitevault/", "public", "adjacent", "Free eRegulatory system for research sites. The product name is SiteVault."),
      C("TriNetX", "https://trinetx.com/clinical-trial-design-optimization/premium/study-feasibility-and-site-identification/", "established", "direct", "Real-world data network used for protocol feasibility and site identification."),
      C("Curebase", "https://www.curebase.ai/", "funded", "adjacent", "Decentralized-trial and eClinical software; $59M raised."),
      C("Advarra", "https://www.advarra.com/", "established", "adjacent", "IRB and site technology; partners with TriNetX on sponsor-side site selection.")
    ],
    sources: [
      S("About 10 percent of sites fail to enroll a single patient and about 40 percent under-enroll", "https://www.clinicalleader.com/doc/getz-site-activations-hurt-by-commodity-mentality-0001", "Tufts CSDD, via Clinical Leader"),
      S("TriNetX and Advarra partner on site selection", "https://trinetx.com/press-releases/advarra-siteiq-plus/", "TriNetX")
    ],
    changes: [
      "Replaced 'under-enrollment is the single most common reason a trial site loses money' with the Tufts CSDD enrollment figures.",
      "Corrected the product name Veeva Site Vault to Veeva SiteVault."
    ],
    openItems: [],
    corrections: [
      { date: "2026-09-22", text: "The audio said under-enrollment is the single most common reason a trial site loses money. That superlative is not supported. The supported claim: Tufts CSDD found about one site in ten enrolls no patients and about four in ten under-enroll. The product is Veeva SiteVault." }
    ]
  },

  "hoa-management-back-office": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("AppFolio", "https://www.appfolio.com/", "public", "adjacent", "Property management software including community associations; suits larger portfolios."),
      C("Buildium (RealPage)", "https://www.buildium.com/portfolios/association-management-software/", "established", "adjacent", "Association management software; a RealPage company."),
      C("Vantaca", "https://www.vantaca.com/", "funded", "adjacent", "HOA software sold to management companies. $300M+ at a $1.25B valuation, October 2025."),
      C("HOA management companies (full-service)", "", "category", "direct", "The per-door full-service alternative boards are avoiding.")
    ],
    sources: [
      S("Between 30 and 40 percent of associations are self-managed", "https://foundation.caionline.org/publications/factbook/statistical-review/", "Foundation for Community Association Research"),
      S("Vantaca raised $300M+ at a $1.25B valuation", "https://www.hypepotamus.com/vantaca-north-carolina-unicorn-2025/", "Hypepotamus")
    ],
    changes: ["Added Buildium's owner (RealPage). No claims needed removal."],
    openItems: [],
    corrections: []
  },

  "expert-witness-prep": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("Everlaw", "https://www.everlaw.com/product/everlaw-ai/", "established", "direct", "Deep Dive for Transcripts produces cited deposition summaries."),
      C("Relativity", "https://www.relativity.com/", "established", "adjacent", "RelativityOne eDiscovery; built for large matters."),
      C("CoCounsel (Thomson Reuters)", "https://www.thomsonreuters.com/en/cocounsel", "public", "direct", "AI legal assistant including deposition preparation."),
      C("Clearbrief", "https://clearbrief.com/", "funded", "direct", "Timelines and deposition summaries with hyperlinked cites inside Word. $4M raised in 2024."),
      C("Legal contract-attorney staffing", "", "category", "direct", "Contract attorneys and freelance paralegals.")
    ],
    sources: [
      S("Solo and small firms adopt technology under tighter resource constraints", "https://www.americanbar.org/groups/law_practice/resources/tech-report/2024/2024-solo-and-small-firm-techreport/", "ABA 2024 Solo and Small Firm TechReport"),
      S("Clearbrief raised $4M", "https://www.geekwire.com/2024/clearbrief-which-uses-ai-to-help-lawyers-find-and-verify-facts-in-legal-docs-raises-4m/", "GeekWire")
    ],
    changes: [
      "Retitled. The service is deposition digests, exhibit indexes and timelines, not expert witness reports.",
      "Linked the ABA TechReport the sourcing note referred to."
    ],
    openItems: [],
    corrections: []
  },

  "manufacturing-work-instructions": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("Tulip Interfaces", "https://tulip.co/digital-guidance/digital-work-instructions/", "established", "adjacent", "No-code frontline apps, including digital work instructions."),
      C("Dozuki", "https://www.dozuki.com/", "established", "direct", "Digital work instructions from the iFixit founders; backed by Marlin Equity."),
      C("Augmentir", "https://www.augmentir.ai/", "established", "adjacent", "AI connected-worker platform."),
      C("VKS", "https://vksapp.com/work-instruction-software", "established", "direct", "No-code visual work instruction software."),
      C("Mitti (formerly SafetyCulture)", "https://mitti.com/", "established", "adjacent", "Inspection and frontline operations platform; SafetyCulture renamed itself Mitti in August 2026.")
    ],
    sources: [
      S("An aging workforce and retirements drive the manufacturing skills gap", "https://www.nist.gov/mep/manufacturing-workforce-development", "NIST MEP"),
      S("SafetyCulture became Mitti in August 2026", "https://mitti.com/media-releases/safetyculture-becomes-mitti-unveiling-a-platform-built-for-the-future-of-frontline-work", "Mitti")
    ],
    changes: [
      "Rewrote the NIST citation. NIST MEP documents workforce and retirement pressure; no 'documentation gap research' was found.",
      "Renamed SafetyCulture to Mitti - the company rebranded in August 2026."
    ],
    openItems: [],
    corrections: [
      { date: "2026-08-30", text: "The sourcing note said NIST MEP publishes small-manufacturer documentation-gap research. NIST MEP documents workforce and retirement pressure; no documentation-gap research was found. SafetyCulture, named in the audio, had renamed itself Mitti earlier in August 2026." }
    ]
  },

  "utility-bill-audit": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("Cass Information Systems", "https://www.cassinfo.com/", "public", "direct", "Utility, telecom and waste invoice processing, audit and payment for large enterprises (Nasdaq: CASS)."),
      C("Tangoe", "https://www.tangoe.com/telecom-expense-management/invoice-audit-optimization/", "established", "adjacent", "Telecom expense management; telecom only."),
      C("Schneider Electric Resource Advisor", "https://www.se.com/ww/en/work/services/energy-and-sustainability/energy-and-sustainability-software/utility-bill-management.jsp", "public", "direct", "Processes 39M+ utility bills and recalculates invoices against contract and tariff rates."),
      C("Local contingency auditors", "", "category", "direct", "Independent contingency-fee bill auditors.")
    ],
    sources: [
      S("Utility tariffs are filed with and published by state commissions (Missouri example)", "https://efis.psc.mo.gov/", "Missouri Public Service Commission EFIS"),
      S("Schneider recalculates invoices against tariff rates to find billing errors", "https://www.se.com/ww/en/work/services/energy-and-sustainability/energy-and-sustainability-software/utility-bill-management.jsp", "Schneider Electric")
    ],
    changes: [
      "Narrowed 'state public utility commissions publish all tariff schedules' - investor-owned utilities file tariffs with state commissions; many co-ops and municipal utilities do not."
    ],
    openItems: [],
    corrections: []
  },

  "curriculum-alignment": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("Faria Education Group (Atlas, ManageBac)", "https://www.faria.org/solutions/curriculum-management/", "established", "direct", "Atlas curriculum mapping (6,000+ schools) and ManageBac are both Faria products."),
      C("Otus", "https://otus.com/", "established", "adjacent", "K-12 assessment, grading and data platform."),
      C("Independent accreditation consultants", "", "category", "direct", "Consultants who write self-studies for schools.")
    ],
    sources: [
      S("Cognia's performance standards and rubric are published", "https://www.cognia.org/standards-based-approach/", "Cognia"),
      S("Atlas is part of Faria Education Group", "https://www.onatlas.com/about", "Atlas")
    ],
    changes: [
      "Corrected 'Chalk (Atlas)'. Atlas belongs to Faria Education Group, which also owns ManageBac - one company, previously listed twice."
    ],
    openItems: [],
    corrections: []
  },

  "restaurant-menu-margin": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("MarginEdge", "https://www.marginedge.com/", "funded", "direct", "Invoice processing and real-time food cost. $45M Series C, over $71M raised; 11,000+ operators."),
      C("Restaurant365", "https://www.restaurant365.com/", "established", "direct", "Restaurant accounting, inventory and operations; 52,000+ restaurants."),
      C("xtraCHEF (Toast)", "https://pos.toasttab.com/products/xtrachef", "public", "direct", "Invoice automation and recipe costing from Toast (NYSE: TOST)."),
      C("Craftable", "https://www.craftable.com/", "established", "direct", "Food and beverage cost control with three-way invoice matching.")
    ],
    sources: [
      S("Food and beverage costs ran a median 31.0 percent of sales for fullservice operators in 2024", "https://restaurant.org/research-and-media/research/restaurant-economic-insights/economic-indicators/food-costs/", "National Restaurant Association"),
      S("MarginEdge raised a $45M Series C", "https://www.restaurantbusinessonline.com/technology/marginedge-raises-45m-back-office-restaurant-software", "Restaurant Business")
    ],
    changes: ["Linked the National Restaurant Association data the sourcing note referred to. No claims needed removal."],
    openItems: [],
    corrections: []
  },

  "sbir-proposal": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("BBCetc", "https://bbcetc.com/", "services", "direct", "SBIR/STTR training and proposal assistance since 1990."),
      C("Granted AI", "https://grantedai.com/", "established", "direct", "AI grant writing with SBIR-specific review; $29-$89 a month."),
      C("TurboSBIR", "https://www.turbosbir.com/", "established", "direct", "SBIR/STTR proposal software ($100 a month) with optional consulting; now part of TurboInnovate."),
      C("Freelance SBIR consultants", "", "category", "direct", "Independent proposal consultants."),
      C("University tech transfer offices", "", "category", "adjacent", "Free help for university spinouts.")
    ],
    sources: [
      S("EVERSANA is a pharmaceutical commercialization company, not an SBIR consultancy", "https://www.eversana.com/i-want-to/commercialize-a-product/", "EVERSANA"),
      S("SBIR.gov publishes solicitations and award data", "https://www.sbir.gov/", "SBIR.gov")
    ],
    changes: [
      "Removed EVERSANA - a pharma commercialization firm, not a grant consultant.",
      "Added Granted AI and TurboSBIR, the software alternatives the list was missing.",
      "Cut 'first-time applicant success rates rise sharply with experienced help' - no source found."
    ],
    openItems: [],
    corrections: []
  },

  "safety-program-docs": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("Novara (formerly KPA Flex)", "https://novara.com/", "established", "direct", "EHS software plus written-program services; KPA spun its Flex EHS business off as Novara in January 2026."),
      C("Mitti (formerly SafetyCulture)", "https://mitti.com/", "established", "adjacent", "Inspection and frontline operations platform; SafetyCulture renamed itself Mitti in August 2026."),
      C("Avetta / ISNetworld (the prequalification platforms themselves)", "https://www.avetta.com/clients/solutions/health-and-safety/prequalification", "established", "adjacent", "The gatekeepers that require the written program."),
      C("Local safety consultants", "", "category", "direct", "Independent safety consultants.")
    ],
    sources: [
      S("Prequalification platforms require a written health and safety program", "https://www.avetta.com/clients/solutions/health-and-safety/prequalification", "Avetta"),
      S("OSHA standards are published", "https://www.osha.gov/laws-regs/regulations/standardnumber/1926", "OSHA"),
      S("KPA separated its EHS software into Novara", "https://kpa.io/blog/kpa-separates-businesses-launching-novara-to-serve-high-risk-industries/", "KPA")
    ],
    changes: [
      "Renamed KPA to Novara - KPA's EHS software business became Novara in January 2026; KPA now serves automotive.",
      "Renamed SafetyCulture to Mitti - the company rebranded in August 2026.",
      "Qualified 'largely templatable': templates must be tailored to each contractor's actual operations, because prequalification reviewers look for operation-specific programs."
    ],
    openItems: [],
    corrections: []
  },

  "estate-inventory": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("EstateExec", "https://www.estateexec.com/", "established", "direct", "Executor software with estate accounting, launched 2015; about $199."),
      C("Atticus", "https://www.weareatticus.com/", "established", "direct", "Estate settlement software plus in-house tax, legal and fiduciary help."),
      C("Trust & Will", "https://trustandwill.com/probate/", "established", "direct", "Launched attorney-guided probate in 2022 after acquiring EZ-Probate."),
      C("Estate attorneys doing it in-house", "", "category", "direct", "The default path for most executors.")
    ],
    sources: [
      S("Trust & Will offers attorney-guided probate", "https://trustandwill.com/probate/attorney-probate", "Trust & Will")
    ],
    changes: [
      "Added Trust & Will's probate service, which competes directly.",
      "Replaced the unverified licensing claim with owner-approved wording (2026-10-09)."
    ],
    openItems: [],
    corrections: []
  },

  "podcast-to-content": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("Castmagic", "https://www.castmagic.io/", "established", "direct", "Bootstrapped; turns recordings into 100+ written assets for $39 a month."),
      C("OpusClip", "https://www.opus.pro/", "established", "adjacent", "AI short-clip generation."),
      C("Descript", "https://www.descript.com/", "established", "adjacent", "AI audio and video editor."),
      C("Jasper", "https://www.jasper.ai/", "established", "adjacent", "AI marketing content platform."),
      C("Traditional content agencies", "", "category", "direct", "Agencies that produce content from source material.")
    ],
    sources: [
      S("46 percent of B2B marketers expect content budgets to rise in 2026", "https://contentmarketinginstitute.com/b2b-research/b2b-content-marketing-trends-research", "Content Marketing Institute")
    ],
    changes: [
      "Replaced 'the marketing budget is already allocated to content nobody is producing' with CMI's budget data.",
      "Corrected the brand name Opus Clip to OpusClip."
    ],
    openItems: [],
    corrections: []
  },

  "insurance-agency-renewal": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("Applied Systems (Applied Epic, Indio)", "https://www1.appliedsystems.com/en-us/news/press-releases/2019/applied-systems-to-acquire-indio-technologies-to-accelerate-digitization-of-commercial-lines-submissions/", "established", "direct", "Applied acquired Indio in 2019 - one company, previously listed twice."),
      C("Vertafore", "https://www.vertafore.com/", "public", "adjacent", "Agency management software; owned by Roper Technologies since 2020."),
      C("Broker Buddha (Acturis)", "https://www.brokerbuddha.com/", "established", "direct", "Commercial applications and renewals; acquired by Acturis in August 2023."),
      C("Sixfold", "https://www.sixfold.ai/", "funded", "adjacent", "AI underwriting sold to insurers, not agencies. $30M Series B, January 2026.")
    ],
    sources: [
      S("Best-practices agencies renewed 92.9 to 97.7 percent of prior-year revenue", "https://www.independentagent.com/news/big-i-and-reagan-consulting-release-2026-best-practices-study-update/", "Big I and Reagan Consulting"),
      S("Sixfold raised a $30M Series B", "https://www.sixfold.ai/content/post/series-b-ai-underwriter", "Sixfold")
    ],
    changes: [
      "Merged Applied Systems and Indio - Applied owns Indio.",
      "Updated Broker Buddha's owner (Acturis) and noted that Sixfold sells to insurers."
    ],
    openItems: [],
    corrections: []
  },

  "translation-localization-niche": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("RWS", "https://www.rws.com/", "public", "direct", "Language services and technology; London-listed (LSE: RWS)."),
      C("Lionbridge", "https://www.lionbridge.com/", "established", "direct", "Global LSP with 500,000+ linguists."),
      C("Smartling", "https://www.smartling.com/", "established", "adjacent", "Translation management system plus language services."),
      C("DeepL", "https://www.deepl.com/", "funded", "adjacent", "Machine translation; $300M at a $2B valuation in 2024."),
      C("TransPerfect", "https://www.transperfect.com/", "established", "direct", "The largest privately owned language services provider.")
    ],
    sources: [
      S("EU MDR Article 10(11) requires device information in the official language(s) each member state sets", "https://eur-lex.europa.eu/eli/reg/2017/745/oj", "EUR-Lex, Regulation (EU) 2017/745"),
      S("Per-word pricing is under review as machine translation shifts the work to review", "https://csa-research.com/Blogs-Events/CSA-in-the-Media/Press-Releases/lsp-pricing-strategies-research-points-to-shifting-landscape", "CSA Research")
    ],
    changes: ["Linked the MDR and CSA Research sources. No claims needed removal."],
    openItems: [],
    corrections: []
  },

  "municipal-records-request": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("GovQA (Granicus)", "https://granicus.com/blog/welcoming-govqa-the-newest-addition-to-our-civic-engagement-platform/", "established", "direct", "Public records software; Granicus acquired it in August 2021."),
      C("NextRequest (CivicPlus)", "https://www.civicplus.com/", "established", "direct", "Public records request management, now under CivicPlus."),
      C("JustFOIA", "https://www.justfoia.com/", "established", "direct", "Records request software with built-in redaction."),
      C("Veritone Redact", "https://www.veritone.com/applications/redact/", "public", "adjacent", "AI audio and video redaction for law enforcement (Nasdaq: VERI).")
    ],
    sources: [
      S("Federal FOIA requests topped 1.5M in FY2024; San Antonio handled 86,000 requests in 2025 versus about 4,000 a decade earlier", "https://utahnewsdispatch.com/2026/03/17/people-are-requesting-more-government-records-than-ever-why-are-they-getting-less/", "Utah News Dispatch"),
      S("Granicus acquired GovQA", "https://www.govtech.com/biz/granicus-buys-public-records-technology-firm-govqa", "GovTech")
    ],
    changes: [
      "Replaced 'MuckRock tracks request volumes' with reported request-volume data."
    ],
    openItems: [],
    corrections: []
  },

  "franchise-compliance-audit": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("FranConnect", "https://www.franconnect.com/", "established", "direct", "Franchise management platform covering operations and quality."),
      C("Naranga", "https://www.capterra.com/p/151025/Naranga/", "established", "direct", "Franchise operations and compliance tracking for emerging and mid-sized brands. Its own site (naranga.com) refused connections on 2026-09-26; listed with current reviews on Capterra."),
      C("Zenput (CrunchTime)", "https://www.crunchtime.com/press/crunchtime-acquires-zenput", "established", "direct", "Brand-standards and food-safety checks; acquired by CrunchTime in June 2022."),
      C("Mitti (formerly SafetyCulture)", "https://mitti.com/", "established", "adjacent", "Inspection and frontline operations platform; SafetyCulture renamed itself Mitti in August 2026.")
    ],
    sources: [
      S("About 845,000 U.S. franchise establishments forecast for 2026", "https://www.franchise.org/franchising-economic-outlook/", "International Franchise Association")
    ],
    changes: [
      "Cut 'field-support ratios' from the IFA citation - IFA publishes establishment counts, not support ratios.",
      "Renamed SafetyCulture to Mitti - the company rebranded in August 2026."
    ],
    openItems: [],
    corrections: []
  },

  "ag-input-agronomy": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("Farmers Business Network", "https://www.fbn.com/", "funded", "direct", "Input marketplace with price transparency and an agronomy model; 117,000+ member farms; $50M raised July 2025."),
      C("Granular Insights (Corteva)", "https://www.corteva.com/us/products-and-solutions/digital-solutions/granular-insights.html", "established", "adjacent", "Corteva discontinued Granular Agronomy in 2022; Insights remains, used with Corteva's seed team."),
      C("AgriEdge Excelsior (Syngenta)", "https://www.syngenta-us.com/agriedge/agriedge-excelsior.aspx", "established", "adjacent", "Syngenta's whole-farm management program - advice from an input seller."),
      C("Independent crop consultants", "", "category", "direct", "Certified crop advisers working for the farmer.")
    ],
    sources: [
      S("Fertilizer ran 33 to 44 percent of corn operating costs from 2010 to 2019", "https://ers.usda.gov/data-products/charts-of-note/100882", "USDA Economic Research Service"),
      S("Corteva discontinued Granular Agronomy in 2022", "https://www.thedailyscoop.com/news/retail-industry/sun-sets-granular-agronomy-new-digital-direction-corteva", "The Scoop")
    ],
    changes: [
      "Updated Granular: Corteva shut down Granular Agronomy in 2022.",
      "Replaced 'input cost is the largest controllable line' with the USDA ERS fertilizer share."
    ],
    openItems: [],
    corrections: []
  },

  "credentialing-service": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("Medallion", "https://www.medallion.co/", "funded", "direct", "Credentialing and enrollment automation; $130M raised, about 1M providers supported."),
      C("Verifiable", "https://verifiable.com/", "funded", "direct", "Provider verification and credentialing automation; $27M Series B (Craft Ventures)."),
      C("CAQH Provider Data Portal (DataSpring)", "https://www.dataspring.com/blog/caqh-rebrands-as-dataspring-to-power-the-next-era-of-healthcare-data", "established", "adjacent", "The industry's provider data utility (formerly ProView) - infrastructure, not a competitor for the work. CAQH became a for-profit owned by health-plan affiliates in January 2026 and rebranded as DataSpring in June 2026."),
      C("Symplr", "https://www.symplr.com/products/symplr-credentialing-suite", "established", "direct", "Credentialing software and CVO services; in 9 of 10 U.S. hospitals."),
      C("Credentialing outsourcers", "", "category", "direct", "Independent credentialing and enrollment firms.")
    ],
    sources: [
      S("32 percent of medical groups report credentialing backlogs; commercial payers can take up to 100 days to set an effective date", "https://www.mgma.com/mgma-stat/confronting-credentialing-reappointment-crunch-time", "MGMA"),
      S("Medallion raised $43M ($130M total)", "https://www.medallion.co/news/medallion-raises-43-million-to-expand-ai-infrastructure-and-launch-credalliance", "Medallion"),
      S("CAQH rebranded as DataSpring in June 2026", "https://www.dataspring.com/blog/caqh-rebrands-as-dataspring-to-power-the-next-era-of-healthcare-data", "DataSpring"),
      S("Verifiable raised a $27M Series B", "https://www.prnewswire.com/news-releases/verifiable-lands-27m-series-b-from-craft-ventures-to-automate-healthcare-provider-credentialing-301873076.html", "PR Newswire")
    ],
    changes: [
      "Linked MGMA's credentialing data the sourcing note referred to.",
      "Renamed CAQH ProView to the CAQH Provider Data Portal (DataSpring) - CAQH rebranded in June 2026."
    ],
    openItems: [],
    corrections: []
  },

  "trade-school-admissions": {
    status: "held",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("Element451", "https://element451.com/", "established", "direct", "AI-first admissions CRM with recruiting agents, from about $20K a year."),
      C("Slate (Technolutions)", "https://technolutions.com/", "established", "adjacent", "Admissions CRM used by 1,000+ colleges; rarely a trade-school tool."),
      C("Salesforce Education Cloud", "https://www.salesforce.com/education/", "public", "adjacent", "CRM platform for institutions."),
      C("In-house admissions staff", "", "category", "direct", "The two-person admissions office this would augment.")
    ],
    sources: [
      S("Title IV schools may not pay any person or entity based on success in securing enrollments", "https://www.ecfr.gov/current/title-34/subtitle-B/chapter-VI/part-668/subpart-B/section-668.14", "34 CFR 668.14(b)(22)"),
      S("Department of Education incentive compensation Q&A", "https://www.ed.gov/laws-and-policy/higher-education-laws-and-policy/program-integrity-information-questions-and-4", "U.S. Department of Education")
    ],
    changes: [],
    openItems: [
      "The pricing advice (flat retainer, never per enrollment) matches 34 CFR 668.14(b)(22), but a listener would act on it as legal guidance. Confirm the wording with education counsel before this idea runs.",
      "Two related rules the entry does not mention: a vendor that handles any Title IV administration (e.g. financial aid processing) may become a third-party servicer under 34 CFR 668.25, and texting prospective students requires consent under the TCPA. Decide whether the brief should name both."
    ],
    corrections: []
  },

  "warranty-claims-recovery": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("Fleetio", "https://www.fleetio.com/features/warranty-management", "established", "direct", "Fleet maintenance software that flags repairs likely under warranty."),
      C("Dossier (now AMCS Fleet Maintenance)", "https://www.amcsgroup.com/solutions/fleet-maintenance/", "established", "adjacent", "Fleet maintenance records with warranty tracking; now sold as AMCS Fleet Maintenance."),
      C("Warranty recovery contingency firms", "", "category", "direct", "Contingency-fee warranty recovery specialists."),
      C("OEM dealer service departments", "", "category", "adjacent", "Dealers file some warranty claims themselves.")
    ],
    sources: [
      S("Truck repair and maintenance averaged 21.5 cents a mile in 2025, up 8.6 percent", "https://truckingresearch.org/about-atri/atri-research/operational-costs-of-trucking/", "ATRI Operational Costs of Trucking")
    ],
    changes: [
      "Corrected the attribution: the fleet cost benchmark is ATRI's (American Transportation Research Institute), not ATA's.",
      "Updated Dossier's current name, AMCS Fleet Maintenance."
    ],
    openItems: [],
    corrections: [
      { date: "2026-09-09", text: "The sourcing note credited fleet maintenance cost benchmarks to ATA. They are published by ATRI, the American Transportation Research Institute. Dossier is now sold as AMCS Fleet Maintenance." }
    ]
  },

  "church-nonprofit-media": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("Subsplash", "https://www.subsplash.com/", "established", "adjacent", "Church apps, media publishing, podcasting and giving."),
      C("Tithe.ly", "https://get.tithe.ly/", "established", "adjacent", "Church giving and management; 30,000+ churches."),
      C("Buzzsprout", "https://www.buzzsprout.com/", "established", "adjacent", "Podcast hosting popular with churches; paid plans from $19 a month."),
      C("Volunteer media teams", "", "category", "direct", "The volunteer doing this today."),
      C("Local video freelancers", "", "category", "direct", "Freelancers hired per project.")
    ],
    sources: [
      S("Median weekly attendance at U.S. congregations was 65 in 2020; about 70 percent have under 100 attending", "https://faithcommunitiestoday.org/fact-2020-survey/", "Faith Communities Today")
    ],
    changes: [
      "Cut the Lake Institute media-spend citation - no such data was found.",
      "Note for review: only about 10 percent of congregations draw over 250 a week, so the 200-2,000 member target is a small slice."
    ],
    openItems: [],
    corrections: []
  },

  "vendor-security-questionnaire": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("Vanta", "https://www.vanta.com/products/trust-center", "established", "direct", "Compliance automation with trust center and questionnaire automation."),
      C("Drata (acquired SafeBase in 2025)", "https://drata.com/blog/acquiring-safebase", "established", "direct", "Drata bought SafeBase for $250M in February 2025 - one company, previously listed twice."),
      C("Conveyor", "https://www.conveyor.com/products/security-questionnaire-automation", "established", "direct", "AI security questionnaire automation plus trust center."),
      C("Whistic", "https://www.whistic.com/", "established", "direct", "Vendor risk platform with a shared trust exchange.")
    ],
    sources: [
      S("Security teams spend about 7 hours a week on vendor security assessments", "https://www.businesswire.com/news/home/20241023116758/en/Vanta-State-of-Trust-Report-2024-Increasing-Risks-Require-Going-Beyond-the-Standard", "Vanta State of Trust"),
      S("Drata acquired SafeBase for $250M", "https://techcrunch.com/2025/02/12/security-compliance-firm-drata-acquires-safebase-for-250m", "TechCrunch")
    ],
    changes: [
      "Merged SafeBase into Drata, which acquired it in February 2025.",
      "Cut the Whistic research citation - none was found."
    ],
    openItems: [],
    corrections: []
  },

  "local-govt-agenda-digest": {
    status: "verified",
    lastVerified: VERIFIED_ON,
    competitors: [
      C("FiscalNote (owns Curate)", "https://www.curatesolutions.com/", "public", "direct", "Curate is part of FiscalNote. Together they ingest 400,000+ meeting documents a week from 12,000+ U.S. cities and counties and 4,000+ school districts. FiscalNote moved from the NYSE to OTC trading in March 2026."),
      C("Polco", "https://info.polco.us/about", "established", "adjacent", "Civic engagement surveys for governments - not commercial monitoring."),
      C("Municode (CivicPlus)", "https://www.civicplus.com/agenda-meeting-management/", "established", "adjacent", "Code publishing and agenda tools sold to governments."),
      C("Local lobbying and government affairs firms", "", "category", "direct", "Firms that monitor by hand for larger clients.")
    ],
    sources: [
      S("FiscalNote's local data covers 400,000+ documents a week across 12,000+ cities and counties and 4,000+ school districts", "https://investors.fiscalnote.com/news/news-details/2026/FiscalNote-Expands-PolicyNote-API-Adding-Local-Government-Intelligence-to-Enterprise-and-AI-Agent-Workflows/default.aspx", "FiscalNote"),
      S("Curate is part of FiscalNote", "https://www.curatesolutions.com/", "Curate")
    ],
    changes: [
      "Merged Curate into FiscalNote, its owner.",
      "Re-rated defensibility from 4 to 2. 'Complete, reliable ingestion of one metro' is not hard to replicate when an incumbent already ingests every U.S. municipality over 2,000 people.",
      "Rewrote the moat around industry-specific judgment instead of ingestion."
    ],
    openItems: [],
    corrections: [
      { date: "2026-08-28", text: "The audio named FiscalNote and Curate as two established players. Curate is part of FiscalNote, which already ingests meeting documents from 12,000+ U.S. municipalities, so the moat this brief described - complete ingestion of one metro - is weaker than stated. Its defensibility rating was lowered from 4 to 2." }
    ]
  },

  // ---- Drafts, 2026-09-27. Researched and sourced like the rest, but not
  // yet approved: needs-review is never selected.
  "buy-ai-bookkeeping-practice": {
    status: "needs-review",
    lastVerified: "2026-09-27",
    competitors: [
      C("Crete Professionals Alliance", "https://www.businesswire.com/news/home/20240502417024/en/Crete-Professionals-Alliance-Reimagines-Accounting-for-the-21st-Century", "funded", "direct", "Thrive Capital-backed roll-up buying accounting firms and deploying OpenAI-built tools; plans more than $500M of acquisitions and reports over $300M in revenue."),
      C("Pilot", "https://pilot.com/", "funded", "adjacent", "AI-assisted bookkeeping, tax and CFO services for startups; launched an autonomous AI Accountant in 2026. Competes for clients, not for practices."),
      C("Private equity accounting roll-ups", "", "category", "direct", "Other buyers bidding for the same practices."),
      C("Search fund buyers", "", "category", "direct", "Individual acquirers using SBA financing.")
    ],
    sources: [
      S("Accounting and tax practices sold at a median of about $500,000 in 2025, at 1.11 times revenue", "https://www.bizbuysell.com/learning-center/valuation-benchmarks/accounting-cpa-tax-practice/", "BizBuySell"),
      S("SBA SOP 50 10 8 requires at least a 10 percent equity injection for a complete change of ownership", "https://starfieldsmith.com/2025/05/best-practices-a-review-of-equity-injection-requirements-under-sop-50-10-8/", "Starfield & Smith"),
      S("Crete Professionals Alliance plans more than $500M to acquire U.S. accounting firms", "https://www.internationalaccountingbulletin.com/news/cpa-over-500m-investment-us-accounting-firms/", "International Accounting Bulletin"),
      S("State accountancy rules modeled on the Uniform Accountancy Act require CPA majority ownership of firms that perform attest work", "https://nasba.org/app/uploads/2018/02/Uniform-Accountancy-Act-%E2%80%93-Eighth-Edition-%E2%80%93-January-2018.pdf", "NASBA / AICPA")
    ],
    changes: ["Drafted 2026-09-27 to add a buy-type idea; not yet approved."],
    openItems: [
      "Owner review: confirm the ratings and the capital plan, and open the sources before approving.",
      "Legal: the entry says to buy a non-attest practice because attest work needs a CPA-majority-owned firm. Confirm the wording.",
      "Debt: this idea rests on an SBA loan and a personal guarantee. The brief has to present it as research, not financing advice."
    ],
    corrections: []
  },

  "buy-ai-property-management-firm": {
    status: "needs-review",
    lastVerified: "2026-09-27",
    competitors: [
      C("Evernest", "https://www.evernest.co/residential-property-management", "funded", "direct", "National property management roll-up; 30+ acquisitions including St. Louis Property Management; about 23,000 units after buying Poplar Homes in 2025."),
      C("AppFolio", "https://www.appfolio.com/", "public", "adjacent", "Property management software - the system of record, not a competitor for owners."),
      C("Buildium (RealPage)", "https://www.buildium.com/", "established", "adjacent", "Property management software for smaller portfolios; a RealPage company."),
      C("Local property management firms", "", "category", "direct", "The other managers in the metro competing for the same owners.")
    ],
    sources: [
      S("Property management businesses: median revenue multiple 0.69, median revenue about $437,667, median asking price in the high $200,000s", "https://www.bizbuysell.com/learning-center/valuation-benchmarks/property-management/", "BizBuySell"),
      S("Evernest acquired St. Louis Property Management, its 30th acquisition", "https://www.evernest.co/evernest-newsroom/evernest-acquires-missouri-based-st-louis-property-management", "Evernest"),
      S("Most states require a real estate license to manage property for others", "https://www.allpropertymanagement.com/resources/property-management-laws/", "All Property Management"),
      S("SBA SOP 50 10 8 requires at least a 10 percent equity injection for a complete change of ownership", "https://starfieldsmith.com/2025/05/best-practices-a-review-of-equity-injection-requirements-under-sop-50-10-8/", "Starfield & Smith")
    ],
    changes: ["Drafted 2026-09-27 to add a buy-type idea; not yet approved."],
    openItems: [
      "Owner review: confirm the ratings and the capital plan, and open the sources before approving.",
      "Legal: licensing and trust-account rules vary by state; the entry tells the buyer to confirm them before closing. Confirm the wording.",
      "Debt: this idea rests on an SBA loan. The brief has to present it as research, not financing advice."
    ],
    corrections: []
  },

  "patient-appeal-app": {
    status: "needs-review",
    lastVerified: "2026-09-27",
    competitors: [
      C("Claimable", "https://www.nbcnews.com/news/us-news/ai-helping-patients-fight-insurance-company-denials-wild-rcna219008", "established", "direct", "AI appeal letters for patients at about $40 an appeal; about 1,000 denials overturned, per NBC News."),
      C("Counterforce Health", "https://www.counterforcehealth.org/", "established", "direct", "Free AI appeal letters for patients and small clinics, funded by grants; reports helping about 20,000 people."),
      C("Patient and medical billing advocates", "", "category", "direct", "Paid human advocates.")
    ],
    sources: [
      S("HealthCare.gov marketplace insurers denied 19 percent of in-network claims in 2024; consumers appealed under 1 percent; insurers upheld 66 percent of appealed denials", "https://www.kff.org/patient-consumer-protections/claims-denials-and-appeals-in-aca-marketplace-plans-in-2024/", "KFF")
    ],
    changes: ["Drafted 2026-09-27 to add a consumer product idea; not yet approved. KFF's consumer-appeal data, misapplied to clinics in the 2026-08-29 episode, is the right source here."],
    openItems: [
      "Owner review: confirm the ratings and the capital plan, and open the sources before approving.",
      "Legal: the product must not give legal or medical advice. Confirm the scope wording.",
      "Market: a free competitor exists. The moat is rated 1, which caps the score at Speculative - decide whether it is worth airing."
    ],
    corrections: []
  }
};

export function verificationFor(id) {
  return VERIFICATION[id] || null;
}
