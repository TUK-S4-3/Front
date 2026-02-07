const videoList = [
  "/videos/SF_org.mp4",
  "/videos/SF.mp4",
  "/videos/TUK.mp4",
];

const bgVideo = document.getElementById("bgVideo");

if (bgVideo) {
  let currentIndex = 0;

  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  if (!prefersReducedMotion) {
    bgVideo.muted = true;
    bgVideo.autoplay = true;
    bgVideo.playsInline = true;
    bgVideo.preload = "metadata";

    const playCurrent = async () => {
      bgVideo.src = videoList[currentIndex];
      bgVideo.load();
      try {
        await bgVideo.play();
      } catch {
        // autoplay 차단 시 무시(사용자 클릭 필요할 수 있음)
      }
    };

    bgVideo.addEventListener("ended", () => {
      currentIndex = (currentIndex + 1) % videoList.length;
      playCurrent();
    });

    playCurrent();
  } else {
    bgVideo.pause();
    bgVideo.removeAttribute("src");
    bgVideo.load();
  }
}
