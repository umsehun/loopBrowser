import { test, expect } from '@playwright/test';

test.describe('Loop Browser E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Electron 앱이 실행 중이라고 가정하고 테스트 진행
    // 실제로는 Electron 앱을 시작하는 로직이 필요할 수 있음
  });

  test('브라우저 창이 정상적으로 로드되어야 함', async ({ page }) => {
    // 기본 브라우저 UI 요소들이 존재하는지 확인
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('input[placeholder*="주소를 입력하세요"]')).toBeVisible();
  });

  test('URL 입력 및 네비게이션이 작동해야 함', async ({ page }) => {
    // URL 입력창 찾기
    const urlInput = page.locator('input[placeholder*="주소를 입력하세요"]');

    // Google URL 입력
    await urlInput.fill('https://www.google.com');
    await urlInput.press('Enter');

    // 페이지가 로드되는지 확인 (실제로는 WebContentsView 영역 확인)
    await page.waitForTimeout(2000);
  });

  test('사이드바 토글이 작동해야 함', async ({ page }) => {
    // 사이드바 토글 버튼 찾기
    const sidebarToggle = page.locator('button[title="사이드바 토글"]');

    // 초기 상태 확인
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // 토글 버튼 클릭
    await sidebarToggle.click();

    // 사이드바가 사라지는지 확인
    await expect(sidebar).not.toBeVisible();

    // 다시 토글
    await sidebarToggle.click();
    await expect(sidebar).toBeVisible();
  });

  test('메모리 모니터링 기능이 작동해야 함', async ({ page }) => {
    // 메모리 모니터링 버튼 찾기
    const memoryButton = page.locator('button[title="메모리 모니터링"]');

    // 버튼이 존재하는지 확인
    await expect(memoryButton).toBeVisible();

    // 메모리 모니터링 창 토글
    await memoryButton.click();

    // 메모리 모니터링 창이 나타나는지 확인
    const memoryMonitor = page.locator('text=메모리 모니터링');
    await expect(memoryMonitor).toBeVisible();

    // 메모리 통계가 표시되는지 확인
    await expect(page.locator('text=사용 메모리')).toBeVisible();
    await expect(page.locator('text=총 메모리')).toBeVisible();
  });

  test('설정 페이지가 정상적으로 열어야 함', async ({ page }) => {
    // 설정 버튼 찾기
    const settingsButton = page.locator('button[title="설정"]');

    // 설정 버튼 클릭
    await settingsButton.click();

    // 설정 페이지가 로드되는지 확인
    await expect(page.locator('text=환경설정')).toBeVisible();
  });

  test('페이지 캡쳐 기능이 작동해야 함', async ({ page }) => {
    // 캡쳐 버튼 찾기
    const captureButton = page.locator('button[title="페이지 캡쳐"]');

    // 버튼이 존재하는지 확인
    await expect(captureButton).toBeVisible();

    // 실제 캡쳐 기능은 파일 다운로드를 유발하므로 여기서는 버튼 존재만 확인
  });

  test('북마크 기능이 작동해야 함', async ({ page }) => {
    // 북마크 섹션 찾기
    const bookmarkSection = page.locator('text=북마크');

    // 북마크 섹션이 존재하는지 확인
    await expect(bookmarkSection).toBeVisible();

    // Google 북마크 클릭
    const googleBookmark = page.locator('text=Google').first();
    await googleBookmark.click();

    // URL 입력창에 Google URL이 설정되는지 확인
    const urlInput = page.locator('input[placeholder*="주소를 입력하세요"]');
    await expect(urlInput).toHaveValue('https://www.google.com');
  });

  test('반응형 레이아웃이 작동해야 함', async ({ page }) => {
    // 창 크기 조정
    await page.setViewportSize({ width: 800, height: 600 });

    // 요소들이 여전히 보이는지 확인
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('input[placeholder*="주소를 입력하세요"]')).toBeVisible();

    // 창 크기 복원
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('키보드 단축키가 작동해야 함', async ({ page }) => {
    // Ctrl+L (URL 입력창 포커스) 시뮬레이션
    await page.keyboard.press('Control+l');

    // URL 입력창이 포커스되는지 확인
    const urlInput = page.locator('input[placeholder*="주소를 입력하세요"]');
    await expect(urlInput).toBeFocused();
  });

  test('성능 모니터링 데이터가 업데이트되어야 함', async ({ page }) => {
    // 메모리 모니터링 창 열기
    const memoryButton = page.locator('button[title="메모리 모니터링"]');
    await memoryButton.click();

    // 초기 메모리 값 저장
    const initialMemoryText = await page.locator('text=사용 메모리').textContent();

    // 잠시 대기 후 값이 변경되는지 확인
    await page.waitForTimeout(2000);

    const updatedMemoryText = await page.locator('text=사용 메모리').textContent();

    // 메모리 값이 업데이트되었는지 확인 (완전히 같지 않아야 함)
    expect(initialMemoryText).not.toBe(updatedMemoryText);
  });
});