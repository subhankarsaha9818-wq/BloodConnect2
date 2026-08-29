const { GoogleGenerativeAI } = require("@google/generative-ai");

console.log("Gemini Key loaded:", !!process.env.GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chat = async (req, res) => {
  try {
    const { message } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
    });

    const prompt = `
You are BloodConnect AI Assistant.

Only answer questions related to:
- Blood Donation
- Blood Groups
- Blood Compatibility
- BloodConnect Websit
- Health & Eligibility

If the question is unrelated, politely say:
"I am the BloodConnect Assistant and can only answer questions related to blood donation and the BloodConnect platform."

User:
${message}
`;

    const result = await model.generateContent(prompt);

    const reply = result.response.text();

    res.json({
      reply,
    });
  } catch (err) {
    console.error("Gemini Error:", err);

res.status(500).json({
  reply: err.message,
});
  }
};

module.exports = { chat };