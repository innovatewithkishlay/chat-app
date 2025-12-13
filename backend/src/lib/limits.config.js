export const PLANS = {
  FREE: "FREE",
  PRO: "PRO",
};

export const LIMITS = {
  [PLANS.FREE]: {
    IMAGES_PER_DAY: 2, // Strict limit for demo
    VIDEOS_PER_DAY: 0, // Not allowed
    VIDEO_CALLS: false, // Not allowed
    MAX_FILE_SIZE: 1 * 1024 * 1024, // 1MB
  },
  [PLANS.PRO]: {
    IMAGES_PER_DAY: 100,
    VIDEOS_PER_DAY: 10,
    VIDEO_CALLS: true,
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  },
};
