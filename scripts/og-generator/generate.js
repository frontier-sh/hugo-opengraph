const fs = require("fs");
const path = require("path");
const { createCanvas, registerFont } = require("canvas");
const glob = require("glob");

// Path configurations
const CONTENT_DIR = path.resolve(__dirname, "../../content");
const OUTPUT_DIR = path.resolve(__dirname, "../../public/og-images");
const PUBLIC_IMAGES_DIR = path.resolve(__dirname, "../../public/images");

// Direct paths to your local TTF files
const FONT_REGULAR_PATH = path.resolve(__dirname, "./FiraCode-Regular.ttf");

// Image configurations
const WIDTH = 1200;
const HEIGHT = 630;
const BG_COLOR = "#16171a"; // Match the site background color
const TEXT_COLOR = "#F8F8F2";
const ACCENT_COLOR = "#78E2A0"; // Match the site accent color (green)
const CURSOR_COLOR = "#78E2A0"; // Match site cursor color

// Register the custom fonts
try {
	// Verify font files exist
	if (!fs.existsSync(FONT_REGULAR_PATH)) {
		throw new Error(`Regular font file not found at: ${FONT_REGULAR_PATH}`);
	}

	// Register the fonts with node-canvas
	console.log(`Registering Regular font from: ${FONT_REGULAR_PATH}`);
	registerFont(FONT_REGULAR_PATH, {
		family: "FiraCode",
		weight: "normal",
	});

	console.log("Font files registered successfully");
} catch (error) {
	console.error("Error registering fonts:", error);
	process.exit(1); // Exit if fonts can't be loaded - they're essential
}

// Make sure the output directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
	fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

if (!fs.existsSync(PUBLIC_IMAGES_DIR)) {
	fs.mkdirSync(PUBLIC_IMAGES_DIR, { recursive: true });
}

// Helper function to extract title from markdown frontmatter
function extractTitleFromMarkdown(filePath) {
	try {
		const content = fs.readFileSync(filePath, "utf8");
		// Updated regex to handle both single and double quotes
		const titleMatch = content.match(/title\s*=\s*['"](.+?)['"]/);

		if (titleMatch && titleMatch[1]) {
			// Properly decode the title string - this handles escaped quotes
			return titleMatch[1].replace(/\\'/g, "'").replace(/\\"/g, '"');
		}
		return path.basename(filePath, path.extname(filePath));
	} catch (error) {
		console.error(`Error reading file ${filePath}:`, error);
		return path.basename(filePath, path.extname(filePath));
	}
}

// Function to wrap text
function wrapText(ctx, text, maxWidth) {
	const words = text.split(" ");
	const lines = [];
	let currentLine = words[0];

	for (let i = 1; i < words.length; i++) {
		const word = words[i];
		const width = ctx.measureText(currentLine + " " + word).width;
		if (width < maxWidth) {
			currentLine += " " + word;
		} else {
			lines.push(currentLine);
			currentLine = word;
		}
	}
	lines.push(currentLine);
	return lines;
}

// Generate the default OpenGraph image
function generateDefaultImage() {
	const outputPath = path.join(PUBLIC_IMAGES_DIR, "default-og.jpg");

	console.log("Generating default OpenGraph image");

	// Create canvas
	const canvas = createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext("2d");

	// Fill background
	ctx.fillStyle = BG_COLOR;
	ctx.fillRect(0, 0, WIDTH, HEIGHT);

	// Add site name with cursor (similar to hero section)
	ctx.font = '100px "FiraCode"';
	ctx.fillStyle = TEXT_COLOR;
	const siteNameText = "Frontier.sh";

	// Draw the cursor block (like in main.scss .site-title::before)
	ctx.fillStyle = CURSOR_COLOR;
	ctx.fillRect(60, 240, 24, 100); // cursor block

	// Draw site name
	ctx.fillStyle = TEXT_COLOR;
	ctx.fillText(siteNameText, 100, 320);

	// Add ASCII line
	ctx.font = '36px "FiraCode"';
	ctx.fillStyle = ACCENT_COLOR;
	ctx.fillText("//////////////////////////////////////////////////", 60, 380);

	// Add site URL at the bottom
	ctx.font = '24px "FiraCode"';
	ctx.fillStyle = ACCENT_COLOR;
	ctx.fillText("frontier.sh", 60, HEIGHT - 60);

	// Save the image
	const buffer = canvas.toBuffer("image/jpeg", { quality: 0.9 });
	fs.writeFileSync(outputPath, buffer);

	console.log(`Generated default OpenGraph image at ${outputPath}`);
}

// Generate image for a single post
function generateImage(postPath, slug) {
	try {
		const title = extractTitleFromMarkdown(postPath);
		const outputPath = path.join(OUTPUT_DIR, `${slug}.jpg`);

		// Check if the image already exists and hasn't been updated
		if (fs.existsSync(outputPath)) {
			const postStats = fs.statSync(postPath);
			const imageStats = fs.statSync(outputPath);

			// Skip if the image is newer than the post
			if (imageStats.mtime > postStats.mtime) {
				console.log(`Skipping ${slug} (already up to date)`);
				return;
			}
		}

		console.log(`Generating OpenGraph image for "${title}" (${slug})`);

		// Create canvas
		const canvas = createCanvas(WIDTH, HEIGHT);
		const ctx = canvas.getContext("2d");

		// Fill background
		ctx.fillStyle = BG_COLOR;
		ctx.fillRect(0, 0, WIDTH, HEIGHT);

		// Add site name with cursor (similar to hero section)
		ctx.font = '60px "FiraCode"';
		ctx.fillStyle = TEXT_COLOR;
		const siteNameText = "Frontier.sh";

		// Draw the cursor block (like in main.scss .site-title::before)
		ctx.fillStyle = CURSOR_COLOR;
		ctx.fillRect(60, 60, 16, 60); // cursor block

		// Draw site name
		ctx.fillStyle = TEXT_COLOR;
		ctx.fillText(siteNameText, 90, 110);

		// Add ASCII line
		ctx.font = '24px "FiraCode"';
		ctx.fillStyle = ACCENT_COLOR;
		ctx.fillText("//////////////////////////////////////////////////", 60, 160);

		// Add title
		ctx.font = '50px "FiraCode"';
		ctx.fillStyle = TEXT_COLOR;

		const titleLines = wrapText(ctx, title, WIDTH - 120);
		let y = 240;

		titleLines.forEach((line) => {
			ctx.fillText(line, 60, y);
			y += 60; // Line height
		});

		// Add site URL at the bottom
		ctx.font = '24px "FiraCode"';
		ctx.fillStyle = ACCENT_COLOR;
		ctx.fillText("frontier.sh", 60, HEIGHT - 60);

		// Save the image
		const buffer = canvas.toBuffer("image/jpeg", { quality: 0.9 });
		fs.writeFileSync(outputPath, buffer);

		console.log(`Generated ${outputPath}`);
	} catch (error) {
		console.error(`Error generating image for ${slug}:`, error);
	}
}

// Process a directory of markdown files
function processDirectory(dirPath) {
	if (!fs.existsSync(dirPath)) return;

	const files = fs.readdirSync(dirPath).filter((file) => file.endsWith(".md") && !file.startsWith("_"));

	for (const file of files) {
		const filePath = path.join(dirPath, file);
		const slug = path.basename(file, ".md");
		generateImage(filePath, slug);
	}
}

// Main function to generate all OpenGraph images
function generateAllImages() {
	console.log("Starting OpenGraph image generation...");
	const startTime = Date.now();

	try {
		// Generate the default OG image first
		generateDefaultImage();

		// Process content directories
		processDirectory(path.join(CONTENT_DIR, "posts"));
		processDirectory(path.join(CONTENT_DIR, "shorts"));
		processDirectory(path.join(CONTENT_DIR, "projects"));

		const duration = (Date.now() - startTime) / 1000;
		console.log(`OpenGraph image generation completed in ${duration.toFixed(2)}s`);
	} catch (error) {
		console.error("Error in image generation process:", error);
		process.exit(1);
	}
}

// Run the generator
generateAllImages();
