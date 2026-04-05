import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Use a larger viewport to see more
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        # Listen for console messages
        page.on("console", lambda msg: print(f"CONSOLE: {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        print("Navigating to http://localhost:5173/webcol/ ...")
        try:
            await page.goto("http://localhost:5173/webcol/", timeout=30000)
        except Exception as e:
            print(f"Failed to load page: {e}")
            await browser.close()
            return

        print("Waiting for Main Menu...")
        try:
            await page.wait_for_selector("text=New Game", timeout=10000)
        except Exception as e:
            print(f"Main menu not found: {e}")
            await page.screenshot(path="main_menu_missing.png")
            await browser.close()
            return

        # Start a new game
        print("Clicking New Game...")
        await page.click("text=New Game")

        print("Waiting for Game Setup Modal...")
        await page.wait_for_selector("text=Start New Game")

        # Select IROQUOIS (Native Tribe) to verify native start
        print("Selecting IROQUOIS...")
        # Scroll the modal down to find IROQUOIS if needed
        await page.locator("text=IROQUOIS").scroll_into_view_if_needed()
        await page.click("text=IROQUOIS")

        print("Clicking Start Game...")
        await page.click("button:has-text('Start Game')")

        # Wait for HUD to appear
        print("Waiting for HUD...")
        try:
            # Look for the yellow highlighted letter in the HUD
            await page.wait_for_selector("text=OAD / SAVE GAME", timeout=15000)
            print("HUD detected!")
        except Exception as e:
            print(f"HUD did not appear: {e}")
            await page.screenshot(path="hud_missing.png")
            # Maybe the game is still loading assets?
            await asyncio.sleep(5)
            await page.screenshot(path="hud_missing_after_delay.png")
            await browser.close()
            return

        # Take a screenshot of the game state
        await page.screenshot(path="game_started_iroquois.png")
        print("Screenshot saved to game_started_iroquois.png")

        # Verify End Turn confirmation
        print("Testing End Turn (Enter)...")
        await page.keyboard.press("Enter")
        try:
            await page.wait_for_selector("text=Units still have moves", timeout=5000)
            print("End Turn confirmation modal appeared!")
            await page.screenshot(path="end_turn_modal.png")
            await page.click("button:has-text('End Turn')")
            print("Confirmed end turn.")
        except Exception as e:
            print(f"End turn modal did not appear: {e}")

        # Check Unit Panel for hotkey highlighting
        print("Checking Unit Panel...")
        # Since I started as Iroquois, I should have an Indian Brave selected (hopefully)
        try:
            # Look for "B" in "BUILD COLONY" or similar if implemented
            # Actually I requested "B for build colony"
            # Let's check if we see "BUILD"
            await page.wait_for_selector("text=UILD", timeout=5000)
            print("Unit panel detected!")
            await page.screenshot(path="unit_panel_verification.png")
        except Exception as e:
            print(f"Unit panel not detected: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
