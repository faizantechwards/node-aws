const express = require("express")
const { body, validationResult } = require("express-validator")
const puppeteer = require("puppeteer-extra")
const StealthPlugin = require("puppeteer-extra-plugin-stealth")
const UserAgent = require("user-agents")

// Add stealth plugin to puppeteer-extra
puppeteer.use(StealthPlugin())

const app = express()
const PORT = process.env.PORT || 3000

app.use((req, res, next) => {
  // Remove the `/api/puppeteer` prefix
  if (req.path.startsWith("/api/puppeteer")) {
    req.url = req.url.replace("/api/puppeteer", "")
  }
  next()
})

// Middleware to test
app.use("/test", (req, res) => {
  const path = process.env.LD_LIBRARY_PATH
  res.send("Inside Test" + path)
})

// Middleware to parse JSON bodies
app.use(express.json())

// Route to handle the POST request
app.post(
  "/fetch-html",
  // Validate the URL using express-validator
  body("url").isURL().withMessage("Invalid URL provided"),
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { url } = req.body

    let status = ""

    try {
      status = "starting"

      // Launch Puppeteer browser with stealth mode enabled
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })

      status += " Browser started"

      const page = await browser.newPage()

      status += " new tab khul gaya"

      // Generate a random desktop User-Agent
      const userAgent = new UserAgent({
        deviceCategory: "desktop",
      })
      await page.setUserAgent(userAgent.toString())

      status += " user agent"

      // Extract the domain from the URL
      const urlObj = new URL(url)
      const domain = urlObj.hostname

      status += " url obj"

      // Set cookies dynamically based on the domain
      const cookies = [
        {
          name: "OTZ",
          value: "7503045_36_36__36_",
          domain: domain,
        },
        {
          name: "SID",
          value:
            "g.a000jQjJJIs8MSiUS7SK2bABEdhVBkLwecuBvm_vx7buPfOSHIEAbkYwVVN7jTEXHDuLV-5wiwACgYKAXoSAQASFQHGX2MiyZxiIAexec4z85qITlZm7xoVAUF8yKqB4cKN2wjpvS0q6JjXQqjY0076",
          domain: domain,
        },
      ]
      await page.setCookie(...cookies)

      status += " cookies set"

      // Set additional headers
      await page.setExtraHTTPHeaders({
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
        Referer:
          "https://trends.google.com/trends/trendingsearches/realtime?geo=US&hl=en-GB&category=all",
        "Sec-Ch-Ua":
          '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Dest": "document",
      })

      status += " Browser header set"

      // Navigate to the URL
      await page.goto(url, { waitUntil: "networkidle2" })

      status += " page goto"

      // Get the page's HTML content
      const html = await page.content()

      status += " html parsed"

      // Close the browser
      await browser.close()

      status += " Browser closed"

      // Return the HTML content
      res.status(200).send({ html })
    } catch (error) {
      console.error("Error fetching HTML:", error)
      res
        .status(500)
        .send({ status, error, msg: "Failed to fetch HTML from the URL" })
    }
  }
)

// Middleware to handle all requests
app.use((req, res) => {
  console.log(`Incoming request to: ${req.path}`)
  res.send(`Hello ${req.path}`)
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
