import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    Election?: unknown;
    ElectionCore?: unknown;
    model?: unknown;
    save?: () => {
      candidatePositions: number[][];
      voterPositions: number[][];
    };
  }
}

const demoPages = [
  "/sandbox/sandbox.html",
  "/play/election1.html",
  "/play/election2.html",
  "/play/election_pr.html",
  "/play/pr_party.html",
  "/play/pr_stv.html",
  "/play/pr_choosemany.html",
  "/play/model1.html",
  "/play/model2.html",
  "/play/model3.html",
  "/play/ballot1.html",
  "/play/ballot2.html",
  "/play/ballot3.html",
];

for (const path of demoPages) {
  test(`${path} loads the simulator runtime`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto(path);
    await page.waitForLoadState("load");
    await page.waitForFunction(() => Boolean(window.ElectionCore));

    await expect(page.locator("canvas")).toHaveCount(1);
    if (path.includes("/ballot")) {
      await expect(page.locator("#ballot")).toHaveCount(1);
    } else {
      await expect(page.locator("#caption")).not.toBeEmpty();
    }

    const runtimeState = await page.evaluate(() => ({
      coreLoaded: Boolean(window.ElectionCore),
      electionLoaded: Boolean(window.Election),
      caption: document.querySelector("#caption")?.textContent?.trim() || "",
    }));

    expect(runtimeState.coreLoaded).toBe(true);
    expect(runtimeState.electionLoaded).toBe(true);
    if (!path.includes("/ballot")) {
      expect(runtimeState.caption.length).toBeGreaterThan(0);
    }
    expect(errors).toEqual([]);
  });
}

test("sandbox save URL round-trips model data", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/play/election_pr.html");
  await page.waitForLoadState("load");
  await page.waitForFunction(() => Boolean(window.model && window.save));

  const saved = await page.evaluate(() => window.save());
  expect(saved.candidatePositions.length).toBeGreaterThan(0);
  expect(saved.voterPositions.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("home page loads its generated JavaScript", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.waitForLoadState("load");

  await expect(page.locator("#splash_iframe")).toHaveCount(1);
  await expect(page.locator("body")).toContainText("To Build a Better Ballot");
  expect(errors).toEqual([]);
});

test("splash page loads its generated JavaScript", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/splash/splash.html");
  await page.waitForLoadState("load");
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.waitForTimeout(100);

  const hasPixels = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return false;
    const context = canvas.getContext("2d");
    if (!context) return false;
    return context.getImageData(0, 0, 10, 10).data.some((value) => value > 0);
  });

  expect(hasPixels).toBe(true);
  expect(errors).toEqual([]);
});

test("proportional demos do not create horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1136, height: 820 });

  await page.goto("/");
  await page.waitForLoadState("load");
  await expect(page.locator("body")).toContainText("To Build a Better Ballot");

  const homeOverflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(homeOverflow.scrollWidth).toBeLessThanOrEqual(
    homeOverflow.clientWidth,
  );

  const chooseManyFrame = page.frameLocator("#pr-choosemany iframe");
  await expect(chooseManyFrame.locator("#caption")).toContainText(
    "reweighted approvals",
  );
  const chooseManyOverflow = await chooseManyFrame
    .locator("#right")
    .evaluate((right) => ({
      clientWidth: right.clientWidth,
      scrollWidth: right.scrollWidth,
    }));
  expect(chooseManyOverflow.scrollWidth).toBeLessThanOrEqual(
    chooseManyOverflow.clientWidth,
  );

  await page.goto("/play/pr_party.html");
  await page.waitForLoadState("load");
  await page.getByText("13", { exact: true }).click();
  const partyOverflow = await page.locator("#right").evaluate((right) => ({
    clientWidth: right.clientWidth,
    scrollWidth: right.scrollWidth,
  }));
  expect(partyOverflow.scrollWidth).toBeLessThanOrEqual(
    partyOverflow.clientWidth,
  );
});
