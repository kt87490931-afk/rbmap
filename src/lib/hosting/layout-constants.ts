/** 클라이언트·서버 공용 레이아웃 상수 (fs 미사용) */
export const GRID_WIDTH = 794
export const CELL_WIDTH = 397
export const CELL_HEIGHT = Math.round((CELL_WIDTH * 16) / 9)

/** 어드민 미리보기용 축소 비율 (실제 embed는 GRID_WIDTH 유지) */
export const ADMIN_PREVIEW_SCALE = 0.4
export const ADMIN_PREVIEW_WIDTH = Math.round(GRID_WIDTH * ADMIN_PREVIEW_SCALE)
export const ADMIN_CELL_WIDTH = Math.round(CELL_WIDTH * ADMIN_PREVIEW_SCALE)
export const ADMIN_CELL_HEIGHT = Math.round(CELL_HEIGHT * ADMIN_PREVIEW_SCALE)
