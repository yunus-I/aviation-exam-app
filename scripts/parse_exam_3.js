const fs = require('fs');

// ── Full passage texts extracted verbatim from the PDF ────────────────────────
const passageA = `Passage A: Cloud Computing
Cloud computing refers to the on-demand availability of computer system resources, especially data storage and computing power, without direct active management by the user. The term is generally used to describe data centers available to many users over the Internet. Large clouds, predominant today, often have functions distributed over multiple locations from central servers. If the connection to the user is relatively close, it may be designated an edge server.
Clouds may be limited to a single organization (enterprise clouds), or be available to many organizations (public cloud). Public clouds host services for multiple clients over the same hardware infrastructure. In contrast, private clouds are dedicated to a single organization, ensuring customizable control and heightened security for sensitive workloads. Hybrid clouds combine both private and public architectures, allowing data and applications to be shared between them.`;

const passageB = `Passage B: Photosynthesis
Photosynthesis is a chemical process used by plants, algae, and certain bacteria to harness energy from sunlight and turn it into chemical energy. This process occurs primarily within chloroplasts, specialized organelles containing chlorophyll. The reaction requires water, carbon dioxide, and light energy to produce glucose and oxygen.
The process is divided into two main stages: the light-dependent reactions and the light-independent reactions (the Calvin Cycle). During the light-dependent stage, solar energy is captured and used to split water molecules, releasing oxygen as a byproduct. In the light-independent stage, the captured energy is used to synthesize glucose from carbon dioxide. This glucose serves as the foundational energy source to fuel the organism's vital metabolic functions.`;

const passageC = `Passage C: Blockchain Technology
A blockchain is a decentralized, distributed, and oftentimes public, digital ledger consisting of records called blocks. These blocks are used to record transactions across many computers so that any involved block cannot be altered retroactively, without the alteration of all subsequent blocks. This allows the participants to verify and audit transactions independently and relatively inexpensively.
A blockchain database is managed autonomously using a peer-to-peer network and a distributed timestamping server. They are authenticated by mass collaboration powered by collective self-interests. Such a design facilitates robust workflow where participants' uncertainty regarding data security is marginal. The use of a blockchain removes the characteristic of infinite reproducibility from a digital asset. It confirms that each unit of value was transferred only once, solving the long-standing problem of double-spending.`;

const passageD = `Passage D: Circadian Rhythms
Circadian rhythms are physical, mental, and behavioral changes that follow a 24-hour cycle. These natural processes respond primarily to light and dark in an organism's environment. Sleeping when it is dark and being awake when it is light is an example of a light-related circadian rhythm. Circadian rhythms are found in most living things, including animals, plants, and many tiny microbes.
In humans, a master clock in the brain coordinates all biological clocks in a living thing, keeping the clocks in sync. The master clock is a group of about 20,000 nerve cells (neurons) that form a structure called the suprachiasmatic nucleus, or SCN. The SCN is located in a part of the brain called the hypothalamus and receives direct input from the eyes. When there is less light—like at night—the SCN tells the brain to make more melatonin, a hormone that makes you sleepy.`;

const passageE = `Passage E: Patents
A patent is a type of intellectual property that gives its owner the legal right to exclude others from making, using, or selling an invention for a limited period of years in exchange for publishing an enabling public disclosure of the invention. In most countries, patent rights fall under private law and the patent holder must sue someone infringing the patent in order to enforce their rights.
To be patentable, an invention must generally meet three criteria: it must be new (novelty), it must involve an inventive step (non-obviousness), and it must be capable of industrial application (utility). Once the patent period—usually 20 years from the filing date—expires, the protection ends, and the invention enters the public domain. This means anyone can commercially exploit the invention without infringing the patent.`;

const passageF = `Passage F: Urban Heat Islands
An urban heat island (UHI) is an urban area or metropolitan area that is significantly warmer than its surrounding rural areas due to human activities. The temperature difference is usually larger at night than during the day, and is most apparent when winds are weak. UHI is most noticeable during the summer and winter.
The main cause of the urban heat island effect is from the modification of land surfaces. Waste heat generated by energy usage is a secondary contributor. As a population center grows, it tends to expand its area and increase its average temperature. Dark surfaces, such as asphalt and roofing, absorb significantly more solar radiation than natural landscapes. Furthermore, the lack of vegetation in urban centers limits evapotranspiration, a process that naturally cools the air. Mitigation strategies include the use of green roofs and the application of light-colored, reflective surfaces in city planning.`;

const passageG = `Passage G: Monetary Policy
Monetary policy is the policy adopted by the monetary authority of a nation to control either the interest rate payable for very short-term borrowing or the money supply, often as an attempt to reduce inflation or the interest rate to ensure price stability and general trust of the value and stability of the nation's currency.
Central banks typically use interest rates as their primary tool. When inflation is high, central banks may raise interest rates to reduce consumer spending and cool the economy. Conversely, during periods of economic stagnation or deflation, central banks may lower interest rates to encourage borrowing and stimulate investment. The ultimate goal is to maintain a stable rate of inflation, usually around 2%, which prevents the erosion of purchasing power while avoiding the dangers of deflationary stagnation.`;

const passageH = `Passage H: Lymphatic System
The lymphatic system is part of the circulatory system and an important part of the immune system, comprising a large network of lymphatic vessels, lymph nodes, lymphatic or lymphoid organs, and lymphoid tissues. The vessels carry a clear fluid called lymph towards the heart.
The lymphatic system has multiple interrelated functions: it is responsible for the removal of interstitial fluid from tissues; it absorbs and transports fatty acids and fats from the digestive system; and it transports white blood cells to and from the lymph nodes into the bones. The lymph nodes act as biological filters, trapping foreign particles and pathogens such as bacteria and viruses. Within the nodes, immune cells called lymphocytes attack and neutralize these threats, providing a crucial defense against infection.`;

// ── The 60 questions defined manually (all 60 from the PDF) ──────────────────
const questions = [
  // Q1: standalone (from digestive system passage in Exam 2)
  {
    num: 1,
    prompt: `41. The human digestive system has no role in absorbing nutrients from food.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `The very first sentence of the passage defines the human digestive system as a process that "involves breaking down food into nutrients that can be absorbed by the body."`
  },

  // Q2–Q6: Passage A – Cloud Computing
  {
    num: 2,
    passage: passageA,
    prompt: `42. Public cloud architectures host services for multiple clients over the same hardware infrastructure.`,
    options: [
      { key: "A", text: "True",  isCorrect: true  },
      { key: "B", text: "False", isCorrect: false }
    ],
    explanation: `The text explicitly states that public clouds "host services for multiple clients over the same hardware."`
  },
  {
    num: 3,
    prompt: `43. Hybrid clouds are deployed exclusively on a single infrastructure type.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `Hybrid clouds combine both private and public architectures, not just one.`
  },
  {
    num: 4,
    prompt: `44. Private clouds offer less customizable control over resources than public clouds.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `The text states private clouds ensure "customizable control."`
  },
  {
    num: 5,
    prompt: `45. Highly sensitive workloads are typically run on public cloud infrastructure.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `The text says private clouds are for sensitive workloads, while public clouds are for less critical tasks.`
  },
  {
    num: 6,
    prompt: `46. Cloud computing relies on shared remote internet resources rather than local servers.`,
    options: [
      { key: "A", text: "True",  isCorrect: true  },
      { key: "B", text: "False", isCorrect: false }
    ],
    explanation: `The first sentence notes it provides resources "without direct active management by the user" via the Internet.`
  },

  // Q7–Q11: Passage B – Photosynthesis
  {
    num: 7,
    passage: passageB,
    prompt: `47. Oxygen is released as a byproduct during the light-independent stage.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `Oxygen is released during the light-dependent stage.`
  },
  {
    num: 8,
    prompt: `48. All living organisms are capable of performing photosynthesis to produce glucose.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `Only "plants, algae, and certain bacteria" are mentioned; animals and fungi cannot do this.`
  },
  {
    num: 9,
    prompt: `49. Chloroplasts are the specialized organelles where the photosynthetic reaction takes place.`,
    options: [
      { key: "A", text: "True",  isCorrect: true  },
      { key: "B", text: "False", isCorrect: false }
    ],
    explanation: `The text explicitly defines chloroplasts as the specialized organelles for this process.`
  },
  {
    num: 10,
    prompt: `50. During the Calvin Cycle, carbon dioxide is captured and synthesized into glucose.`,
    options: [
      { key: "A", text: "True",  isCorrect: true  },
      { key: "B", text: "False", isCorrect: false }
    ],
    explanation: `The text confirms the Calvin Cycle (light-independent stage) synthesizes glucose from CO2.`
  },
  {
    num: 11,
    prompt: `51. Glucose serves as a foundational energy source for the organism's metabolic functions.`,
    options: [
      { key: "A", text: "True",  isCorrect: true  },
      { key: "B", text: "False", isCorrect: false }
    ],
    explanation: `This is confirmed in the final sentence of the passage.`
  },

  // Q12–Q16: Passage C – Blockchain Technology
  {
    num: 12,
    passage: passageC,
    prompt: `52. Blockchain technology increases the necessity for central clearing houses.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `The decentralized nature eliminates the need for central authorities.`
  },
  {
    num: 13,
    prompt: `53. Each block in a blockchain is securely linked to the preceding block using cryptographic hashing.`,
    options: [
      { key: "A", text: "True",  isCorrect: true  },
      { key: "B", text: "False", isCorrect: false }
    ],
    explanation: `The concept of blocks not being alterable without "alteration of all subsequent blocks" describes this secure link.`
  },
  {
    num: 14,
    prompt: `54. It is mathematically impossible to alter historical data within a blockchain network.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `It requires the "alteration of all subsequent blocks," which is extremely difficult but not defined as "mathematically impossible" in the logic of the text.`
  },
  {
    num: 15,
    prompt: `55. Data blocks within a blockchain ledger are distributed randomly to network nodes.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `The ledger is distributed across many computers, but blocks are linear and chronological, not random.`
  },
  {
    num: 16,
    prompt: `56. A blockchain ledger is distributed to all participating nodes simultaneously.`,
    options: [
      { key: "A", text: "True",  isCorrect: true  },
      { key: "B", text: "False", isCorrect: false }
    ],
    explanation: `The text describes it as a "distributed digital ledger" across a peer-to-peer network.`
  },

  // Q17–Q21: Passage D – Circadian Rhythms
  {
    num: 17,
    passage: passageD,
    prompt: `57. When ambient light levels decrease, the SCN signals the pineal gland to secrete melatonin.`,
    options: [
      { key: "A", text: "True",  isCorrect: true  },
      { key: "B", text: "False", isCorrect: false }
    ],
    explanation: `The text states: "When there is less light... the SCN tells the brain to make more melatonin."`
  },
  {
    num: 18,
    prompt: `58. The primary master clock in mammals is located within the pineal gland.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `The master clock is the SCN, located in the hypothalamus.`
  },
  {
    num: 19,
    prompt: `59. Circadian rhythms help regulate internal body temperature and hormone release.`,
    options: [
      { key: "A", text: "True",  isCorrect: true  },
      { key: "B", text: "False", isCorrect: false }
    ],
    explanation: `"Hormone release" (melatonin) is explicitly confirmed in the passage.`
  },
  {
    num: 20,
    prompt: `60. Light cues are directly received and processed by the pineal gland without ocular input.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `The SCN "receives direct input from the eyes."`
  },
  {
    num: 21,
    prompt: `61. Circadian rhythms follow a strict, unchangeable 12-hour cycle.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `They follow a 24-hour cycle.`
  },

  // Q22–Q26: Passage E – Patents
  {
    num: 22,
    passage: passageE,
    prompt: `62. Patents grant inventors an indefinite period of exclusive commercial rights.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `It is for a "limited period," usually 20 years.`
  },
  {
    num: 23,
    prompt: `63. To receive a patent, an invention must be completely obvious to an expert in the field.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `It must be "non-obvious."`
  },
  {
    num: 24,
    prompt: `64. Patent applicants are allowed to keep the technical specifications of their invention completely secret.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `They must provide an "enabling public disclosure."`
  },
  {
    num: 25,
    prompt: `65. Once a patent expires, anyone is legally permitted to manufacture or sell the invention without paying royalties.`,
    options: [
      { key: "A", text: "True",  isCorrect: true  },
      { key: "B", text: "False", isCorrect: false }
    ],
    explanation: `It enters the "public domain."`
  },
  {
    num: 26,
    prompt: `66. The three primary criteria for patentability are novelty, non-obviousness, and practical utility.`,
    options: [
      { key: "A", text: "True",  isCorrect: true  },
      { key: "B", text: "False", isCorrect: false }
    ],
    explanation: `These are the three criteria listed in the second paragraph.`
  },

  // Q27–Q31: Passage F – Urban Heat Islands
  {
    num: 27,
    passage: passageF,
    prompt: `66. A high density of vegetation in urban centers significantly limits evapotranspiration.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `The text says a lack of vegetation limits it; more vegetation would increase it.`
  },
  {
    num: 28,
    prompt: `67. Dark surfaces like asphalt and concrete absorb and retain more solar radiation than natural landscapes.`,
    options: [
      { key: "A", text: "True",  isCorrect: true  },
      { key: "B", text: "False", isCorrect: false }
    ],
    explanation: `The text explicitly states dark surfaces "absorb significantly more solar radiation."`
  },
  {
    num: 29,
    prompt: `68. Highly reflective surface coatings are a viable mitigation tool used by urban planners.`,
    options: [
      { key: "A", text: "True",  isCorrect: true  },
      { key: "B", text: "False", isCorrect: false }
    ],
    explanation: `The text lists "light-colored, reflective surfaces" as a mitigation strategy.`
  },
  {
    num: 30,
    prompt: `69. The Urban Heat Island effect describes urban areas being significantly warmer than surrounding oceans.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `It compares urban areas to "surrounding rural areas."`
  },
  {
    num: 31,
    prompt: `70. Increasing urban canopies and foliage can help counteract the heat island effect.`,
    options: [
      { key: "A", text: "True",  isCorrect: true  },
      { key: "B", text: "False", isCorrect: false }
    ],
    explanation: `Since a lack of vegetation causes heat, adding foliage (vegetation) counteracts it.`
  },

  // Q32–Q36: Passage G – Monetary Policy
  {
    num: 32,
    passage: passageG,
    prompt: `71. Raising interest rates is a tool used by central banks to accelerate consumer spending.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `Raising rates is used to "reduce consumer spending."`
  },
  {
    num: 33,
    prompt: `72. Deflation describes an economic period characterized by a rapid, uncontrollable rise in consumer prices.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `That is the definition of inflation. Deflation is a drop in prices.`
  },
  {
    num: 34,
    prompt: `73. High inflation systematically erodes the purchasing power of an economy's currency.`,
    options: [
      { key: "A", text: "True",  isCorrect: true  },
      { key: "B", text: "False", isCorrect: false }
    ],
    explanation: `The text states the goal is to "prevent the erosion of purchasing power" caused by high inflation.`
  },
  {
    num: 35,
    prompt: `74. Central banks manage monetary stability primarily by adjusting corporate tax rates.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `They use "interest rates" as their primary tool.`
  },
  {
    num: 36,
    prompt: `75. When inflation falls below target levels, lowering interest rates can help stimulate economic activity.`,
    options: [
      { key: "A", text: "True",  isCorrect: true  },
      { key: "B", text: "False", isCorrect: false }
    ],
    explanation: `Lowering rates "encourage borrowing and stimulate investment."`
  },

  // Q37–Q41: Passage H – Lymphatic System
  {
    num: 37,
    passage: passageH,
    prompt: `76. The lymphatic system operates completely independently of the cardiovascular circulatory system.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `It is "part of the circulatory system."`
  },
  {
    num: 38,
    prompt: `77. Lymph nodes function as biological filters to neutralize foreign pathogens.`,
    options: [
      { key: "A", text: "True",  isCorrect: true  },
      { key: "B", text: "False", isCorrect: false }
    ],
    explanation: `The text states they act as "biological filters, trapping foreign particles."`
  },
  {
    num: 39,
    prompt: `78. Excess interstitial fluid accumulates primarily inside the lymph nodes before draining.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `It is removed "from tissues."`
  },
  {
    num: 40,
    prompt: `79. Lymph nodes are packed with immune cells called lymphocytes.`,
    options: [
      { key: "A", text: "True",  isCorrect: true  },
      { key: "B", text: "False", isCorrect: false }
    ],
    explanation: `Confirmed in the final paragraph.`
  },
  {
    num: 41,
    prompt: `80. The primary role of the lymphatic system is the continuous production of red blood cells.`,
    options: [
      { key: "A", text: "True",  isCorrect: false },
      { key: "B", text: "False", isCorrect: true  }
    ],
    explanation: `It transports "white blood cells." Red blood cells are not mentioned as a role.`
  },

  // Q42–Q56: Correct Spelling Identification
  {
    num: 42,
    prompt: `41. Choose the correct spelling:`,
    options: [
      { key: "A", text: "Publically", isCorrect: false },
      { key: "B", text: "Publicly",   isCorrect: true  },
      { key: "C", text: "Publically", isCorrect: false },
      { key: "D", text: "Publiclye",  isCorrect: false }
    ],
    explanation: `Publicly is the standard adverb form.`
  },
  {
    num: 43,
    prompt: `42. Choose the correct spelling:`,
    options: [
      { key: "A", text: "Occurence",  isCorrect: false },
      { key: "B", text: "Occurrence", isCorrect: true  },
      { key: "C", text: "Occurrance", isCorrect: false },
      { key: "D", text: "Ocurence",   isCorrect: false }
    ],
    explanation: `Double 'c' and double 'r'.`
  },
  {
    num: 44,
    prompt: `43. Choose the correct spelling:`,
    options: [
      { key: "A", text: "Maintenance",   isCorrect: true  },
      { key: "B", text: "Maintainance",  isCorrect: false },
      { key: "C", text: "Maintenence",   isCorrect: false },
      { key: "D", text: "Maintainence",  isCorrect: false }
    ],
    explanation: `Vowel change from "maintain."`
  },
  {
    num: 45,
    prompt: `44. Choose the correct spelling:`,
    options: [
      { key: "A", text: "Liesure",  isCorrect: false },
      { key: "B", text: "Lesure",   isCorrect: false },
      { key: "C", text: "Leisure",  isCorrect: true  },
      { key: "D", text: "Leishure", isCorrect: false }
    ],
    explanation: `Common "ei" exception.`
  },
  {
    num: 46,
    prompt: `45. Choose the correct spelling:`,
    options: [
      { key: "A", text: "Unecessary",   isCorrect: false },
      { key: "B", text: "Unneccessary", isCorrect: false },
      { key: "C", text: "Unnecessary",  isCorrect: true  },
      { key: "D", text: "Unnecesary",   isCorrect: false }
    ],
    explanation: `One 'n' in prefix, two 'c's in root.`
  },
  {
    num: 47,
    prompt: `46. Choose the correct spelling:`,
    options: [
      { key: "A", text: "Accessible", isCorrect: true  },
      { key: "B", text: "Accessable", isCorrect: false },
      { key: "C", text: "Acesible",   isCorrect: false },
      { key: "D", text: "Accesible",  isCorrect: false }
    ],
    explanation: `Ends in -ible.`
  },
  {
    num: 48,
    prompt: `47. Choose the correct spelling:`,
    options: [
      { key: "A", text: "Proscedure", isCorrect: false },
      { key: "B", text: "Procedure",  isCorrect: true  },
      { key: "C", text: "Proceedure", isCorrect: false },
      { key: "D", text: "Prosedure",  isCorrect: false }
    ],
    explanation: `One 'o', no double 'e'.`
  },
  {
    num: 49,
    prompt: `48. Choose the correct spelling:`,
    options: [
      { key: "A", text: "Restaraunt", isCorrect: false },
      { key: "B", text: "Restaurant", isCorrect: true  },
      { key: "C", text: "Resturant",  isCorrect: false },
      { key: "D", text: "Resterant",  isCorrect: false }
    ],
    explanation: `Features "-au-".`
  },
  {
    num: 50,
    prompt: `49. Choose the correct spelling:`,
    options: [
      { key: "A", text: "Prioraties", isCorrect: false },
      { key: "B", text: "Prioritys",  isCorrect: false },
      { key: "C", text: "Priorities", isCorrect: true  },
      { key: "D", text: "Prioreties", isCorrect: false }
    ],
    explanation: `Standard pluralization.`
  },
  {
    num: 51,
    prompt: `50. Choose the correct spelling:`,
    options: [
      { key: "A", text: "Millenium",  isCorrect: false },
      { key: "B", text: "Millennium", isCorrect: true  },
      { key: "C", text: "Milennium",  isCorrect: false },
      { key: "D", text: "Millennum",  isCorrect: false }
    ],
    explanation: `Double 'l' and double 'n'.`
  },
  {
    num: 52,
    prompt: `51. Choose the correct spelling:`,
    options: [
      { key: "A", text: "Fullfil",  isCorrect: false },
      { key: "B", text: "Fullfill", isCorrect: false },
      { key: "C", text: "Fulfill",  isCorrect: true  },
      { key: "D", text: "Fulfull",  isCorrect: false }
    ],
    explanation: `US Standard spelling.`
  },
  {
    num: 53,
    prompt: `52. Choose the correct spelling:`,
    options: [
      { key: "A", text: "Minature",  isCorrect: false },
      { key: "B", text: "Miniature", isCorrect: true  },
      { key: "C", text: "Minnature", isCorrect: false },
      { key: "D", text: "Miniatire", isCorrect: false }
    ],
    explanation: `Includes the "ia".`
  },
  {
    num: 54,
    prompt: `53. Choose the correct spelling:`,
    options: [
      { key: "A", text: "Temperment",  isCorrect: false },
      { key: "B", text: "Temperament", isCorrect: true  },
      { key: "C", text: "Temprement",  isCorrect: false },
      { key: "D", text: "Tempurament", isCorrect: false }
    ],
    explanation: `Root is "tempera-".`
  },
  {
    num: 55,
    prompt: `54. Choose the correct spelling:`,
    options: [
      { key: "A", text: "Basicly",   isCorrect: false },
      { key: "B", text: "Basiclye",  isCorrect: false },
      { key: "C", text: "Basically", isCorrect: true  },
      { key: "D", text: "Basicaly",  isCorrect: false }
    ],
    explanation: `Adverb suffix "-ally".`
  },
  {
    num: 56,
    prompt: `55. Choose the correct spelling:`,
    options: [
      { key: "A", text: "Transfered",  isCorrect: false },
      { key: "B", text: "Transferred", isCorrect: true  },
      { key: "C", text: "Transfered",  isCorrect: false },
      { key: "D", text: "Transferrd",  isCorrect: false }
    ],
    explanation: `Doubled consonant.`
  },

  // Q57–Q60 + Q61: Redundancy & Pleonasm Elimination (only 4 to reach 60 total)
  {
    num: 57,
    prompt: `56. "The teams decided to merge together." — Select the redundant word:`,
    options: [
      { key: "A", text: "teams",   isCorrect: false },
      { key: "B", text: "decided", isCorrect: false },
      { key: "C", text: "merge",   isCorrect: false },
      { key: "D", text: "together",isCorrect: true  }
    ],
    explanation: `Merge already means to come together.`
  },
  {
    num: 58,
    prompt: `57. "Please reply back to this email." — Select the redundant word:`,
    options: [
      { key: "A", text: "please", isCorrect: false },
      { key: "B", text: "reply",  isCorrect: false },
      { key: "C", text: "back",   isCorrect: true  },
      { key: "D", text: "email",  isCorrect: false }
    ],
    explanation: `Reply means to answer back.`
  },
  {
    num: 59,
    prompt: `58. "The cost is approximately about $100." — Select the redundant word:`,
    options: [
      { key: "A", text: "cost",         isCorrect: false },
      { key: "B", text: "approximately",isCorrect: false },
      { key: "C", text: "about",        isCorrect: true  },
      { key: "D", text: "$100",         isCorrect: false }
    ],
    explanation: `Approximately and about mean the same thing. Use one.`
  },
  {
    num: 60,
    prompt: `59. "Learn the basic fundamentals." — Select the redundant word:`,
    options: [
      { key: "A", text: "learn",       isCorrect: false },
      { key: "B", text: "basic",       isCorrect: true  },
      { key: "C", text: "fundamentals",isCorrect: false },
      { key: "D", text: "the",         isCorrect: false }
    ],
    explanation: `Fundamentals are basic.`
  }
];

// Build final payload
const finalQuestions = questions.map(q => {
  let fullPrompt = q.passage ? q.passage + "\n\n" + q.prompt : q.prompt;
  return {
    key: `cabin-exam-3-q${q.num}`,
    topicSlug: "exam 3",
    type: "multiple_choice",
    prompt: fullPrompt,
    explanation: q.explanation,
    options: q.options
  };
});

const payload = {
  questionBank: {
    key: "cabin-exam-bank-3",
    slug: "cabin-exam-3",
    title: "Cabin Crew Exam 3 Bank",
    description: "Reading Comprehension, Spelling, Grammar",
    departmentCode: "CABIN"
  },
  examSet: {
    key: "cabin-exam-set-3",
    slug: "cabin-exam-3",
    title: "Exam 3",
    description: "Cabin Crew Exam 3",
    departmentCode: "CABIN",
    topicSlug: "exam 3",
    mode: "mock",
    durationMinutes: 90,
    published: true
  },
  questions: finalQuestions
};

fs.writeFileSync('cabin-exam-3.json', JSON.stringify(payload, null, 2));
console.log('Wrote cabin-exam-3.json with', finalQuestions.length, 'questions.');
