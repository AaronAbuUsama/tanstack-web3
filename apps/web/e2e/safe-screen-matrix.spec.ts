import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";

const artifactsDir = path.join(process.cwd(), "e2e", "artifacts", "prd4");

const ACCOUNT_ZERO = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const ACCOUNT_ONE = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const ACCOUNT_TWO = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
const CHIADO_CHAIN_ID = "10200";

const desktopViewport = { width: 1440, height: 900 };
const mobileViewport = { width: 390, height: 844 };

function getWalletBar(page: Page): Locator {
	return page.getByRole("button", { name: "Disconnect" }).locator("xpath=..");
}

async function takeArtifact(page: Page, fileName: string, viewport: "desktop" | "mobile") {
	mkdirSync(artifactsDir, { recursive: true });
	await page.setViewportSize(viewport === "desktop" ? desktopViewport : mobileViewport);
	await page.waitForTimeout(150);
	await page.screenshot({
		path: path.join(artifactsDir, `${fileName}-${viewport}.png`),
		fullPage: true,
	});
}

async function connectDevWallet(page: Page, accountIndex: number) {
	await page.goto("/safe");
	await expect(page.getByRole("heading", { name: "Safe Dashboard" })).toBeVisible();
	const disconnectButton = page.getByRole("button", { name: "Disconnect" });
	if ((await disconnectButton.count()) === 0) {
		await page.getByRole("button", { name: "Dev Wallet" }).first().click();
	}

	const walletBar = getWalletBar(page);
	const chainSelect = walletBar.locator("select").nth(1);
	await expect(chainSelect).toBeVisible();
	await chainSelect.selectOption(CHIADO_CHAIN_ID);
	await expect(chainSelect).toHaveValue(CHIADO_CHAIN_ID);

	const devAccountSelect = page.getByLabel("Dev Account");
	await expect(devAccountSelect).toBeVisible();
	await devAccountSelect.selectOption(String(accountIndex));

	const addressText = walletBar.locator("span.font-mono").first();
	if (accountIndex === 0) {
		await expect.poll(async () => (await addressText.textContent()) ?? "").toMatch(/0xf39f/i);
	} else if (accountIndex === 1) {
		await expect.poll(async () => (await addressText.textContent()) ?? "").toMatch(/0x7099/i);
	}

	return { chainSelect, devAccountSelect, walletBar };
}

async function deployThreeOwnerSafe(page: Page) {
	const createSafePanel = page
		.locator("div.bg-gray-800")
		.filter({
			has: page.getByRole("heading", { name: "Create New Safe" }),
		})
		.first();
	await expect(createSafePanel).toBeVisible();

	const ownerInputs = createSafePanel.locator('input[placeholder="0x..."]');
	await ownerInputs.first().fill(ACCOUNT_ZERO);
	await createSafePanel.getByRole("button", { name: "+ Add Owner" }).click();
	await createSafePanel.getByRole("button", { name: "+ Add Owner" }).click();
	await expect(ownerInputs).toHaveCount(3);

	await ownerInputs.nth(1).fill(ACCOUNT_ONE);
	await ownerInputs.nth(2).fill(ACCOUNT_TWO);
	await createSafePanel.getByRole("button", { name: /^2$/ }).click();
	await createSafePanel.getByRole("button", { name: "Deploy Safe" }).click();

	await expect(page.getByText("Safe Address")).toBeVisible({ timeout: 120_000 });
	await expect(page.getByText("2 of 3")).toBeVisible({ timeout: 60_000 });
}

async function createPendingTransaction(page: Page) {
	const txBuilder = page
		.locator("div.bg-gray-800")
		.filter({
			has: page.getByRole("heading", { name: "Transaction Builder" }),
		})
		.first();
	await expect(txBuilder).toBeVisible();
	await txBuilder.locator('input[placeholder="0x..."]').fill(ACCOUNT_ONE);
	await txBuilder.locator('input[placeholder="0.0"]').fill("0");
	await txBuilder.getByRole("button", { name: "Build Transaction" }).click();
	await expect(page.getByRole("heading", { name: /Pending Transactions/ })).toBeVisible();
}

test("safe screen matrix: setup and pre-safe account/chain states", async ({ page }) => {
	await page.addInitScript(() => window.localStorage.clear());
	const { chainSelect, devAccountSelect, walletBar } = await connectDevWallet(page, 0);
	const addressText = walletBar.locator("span.font-mono").first();

	await takeArtifact(page, "t6-setup-runtime-account0", "desktop");

	await devAccountSelect.selectOption("1");
	await expect.poll(async () => (await addressText.textContent()) ?? "").toMatch(/0x7099/i);
	await takeArtifact(page, "t6-setup-runtime-account1", "desktop");
	await takeArtifact(page, "t6-setup-runtime", "mobile");

	await page.setViewportSize(desktopViewport);
	await chainSelect.selectOption("1");
	await expect(chainSelect).toHaveValue("1");
	await expect(page.getByText(/Transaction Service mode:/)).toBeVisible();
	await takeArtifact(page, "t2-transactions-tx-service", "desktop");

	await expect(page.getByText("Threshold (1 of 1)")).toBeVisible();
	await takeArtifact(page, "t3-owners-1of1", "desktop");
});

test("safe screen matrix: deployed safe baseline states", async ({ page }) => {
	await page.addInitScript(() => window.localStorage.clear());
	await connectDevWallet(page, 0);
	await deployThreeOwnerSafe(page);

	await takeArtifact(page, "t1-overview-standalone", "desktop");
	await takeArtifact(page, "t1-overview-standalone", "mobile");

	await page.setViewportSize(desktopViewport);
	await createPendingTransaction(page);
	await expect(page.getByText(/Local-only:/).first()).toBeVisible();
	await page.getByRole("heading", { name: "Transactions", exact: true }).scrollIntoViewIfNeeded();
	await takeArtifact(page, "t2-transactions-local", "desktop");
	await takeArtifact(page, "t2-transactions", "mobile");

	await page.setViewportSize(desktopViewport);
	await page.getByRole("heading", { name: /Owners \(\d+\)/ }).first().scrollIntoViewIfNeeded();
	await takeArtifact(page, "t3-owners-2of3", "desktop");
	await takeArtifact(page, "t3-owners", "mobile");

	await page.setViewportSize(desktopViewport);
	await page.getByRole("heading", { name: /Transaction Guard \(0\)/ }).scrollIntoViewIfNeeded();
	await takeArtifact(page, "t4-guard-inactive", "desktop");
	await takeArtifact(page, "t4-guard", "mobile");

	await page.setViewportSize(desktopViewport);
	await page.getByRole("heading", { name: /Modules \(0\)/ }).scrollIntoViewIfNeeded();
	await takeArtifact(page, "t5-modules-empty", "desktop");
	await takeArtifact(page, "t5-modules", "mobile");

	const deployGuardButton = page.getByRole("button", { name: "Deploy Guard" });
	if (await deployGuardButton.count()) {
		await page.setViewportSize(desktopViewport);
		await deployGuardButton.first().click();
		const enableGuardButton = page.getByRole("button", { name: "Enable Guard" });
		if (await enableGuardButton.count()) {
			await enableGuardButton.first().click();
			await expect(page.getByRole("heading", { name: /Transaction Guard \(1\)/ })).toBeVisible({
				timeout: 60_000,
			});
			await takeArtifact(page, "t4-guard-active", "desktop");
		}
	}

	const deployModuleButton = page.getByRole("button", { name: "Deploy AllowanceModule" });
	if (await deployModuleButton.count()) {
		await page.setViewportSize(desktopViewport);
		await deployModuleButton.first().click();
		const enableModuleButton = page.getByRole("button", { name: "Enable Module" });
		if (await enableModuleButton.count()) {
			await enableModuleButton.first().click();
			await expect(page.getByRole("heading", { name: /Modules \([1-9]\d*\)/ })).toBeVisible({
				timeout: 60_000,
			});
			await takeArtifact(page, "t5-modules-active", "desktop");
		}
	}
});
