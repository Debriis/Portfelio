import { crtSettings } from "../../../animations/settings";
import {
  sceneVertex,
  sceneFragment,
  glassVertex,
  glassFragment,
} from "./shaders";
type Tex = {
  texture: WebGLTexture;
  width: number;
  height: number;
  source: string;
};
function program(gl: WebGL2RenderingContext, vertex: string, fragment: string) {
  const shaders = [
    [gl.VERTEX_SHADER, vertex],
    [gl.FRAGMENT_SHADER, fragment],
  ] as const;
  const compiled = shaders.map(([type, source]) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw Error(error || "Shader compilation failed");
    }
    return shader;
  });
  const result = gl.createProgram()!;
  compiled.forEach((shader) => gl.attachShader(result, shader));
  gl.linkProgram(result);
  compiled.forEach((shader) => gl.deleteShader(shader));
  if (!gl.getProgramParameter(result, gl.LINK_STATUS))
    throw Error(gl.getProgramInfoLog(result) || "Shader linking failed");
  return result;
}
export function createCrtRenderer(
  canvas: HTMLCanvasElement,
  root: HTMLElement,
) {
  const context = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "default",
  });
  if (!context) return null;
  const gl: WebGL2RenderingContext = context;
  const scene = program(gl, sceneVertex, sceneFragment),
    glass = program(gl, glassVertex, glassFragment);
  const buffer = gl.createBuffer()!,
    framebuffer = gl.createFramebuffer()!,
    frameTexture = gl.createTexture()!;
  const vaoScene = gl.createVertexArray()!,
    vaoGlass = gl.createVertexArray()!;
  const textures = new Map<HTMLImageElement, Tex>();
  let ticker: Tex | null = null,
    tickerKey = "",
    width = 0,
    height = 0;
  const locations = (p: WebGLProgram, names: string[]) =>
    Object.fromEntries(
      names.map((name) => [name, gl.getUniformLocation(p, name)]),
    );
  const s = locations(scene, [
    "uRect",
    "uSize",
    "uCrop",
    "uRectSize",
    "uRadius",
    "uFocus",
    "uImage",
  ]);
  const g = locations(glass, [
    "uScene",
    "uResolution",
    "uPull",
    "uTime",
    "uCurvature",
    "uChroma",
    "uScan",
    "uGrain",
  ]);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
    gl.STATIC_DRAW,
  );
  for (const [vao, p] of [
    [vaoScene, scene],
    [vaoGlass, glass],
  ] as const) {
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const at = gl.getAttribLocation(p, "aPoint");
    gl.enableVertexAttribArray(at);
    gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
  }
  function bindTexture(texture: WebGLTexture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  function textureFor(image: HTMLImageElement) {
    if (!image.complete || !image.naturalWidth) return null;
    const source = image.currentSrc || image.src,
      old = textures.get(image);
    if (old?.source === source) return old;
    if (old) gl.deleteTexture(old.texture);
    const texture = gl.createTexture()!;
    bindTexture(texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    let pixels: TexImageSource = image;
    if (source.split("?")[0].endsWith(".svg")) {
      const raster = document.createElement("canvas");
      raster.width = image.naturalWidth;
      raster.height = image.naturalHeight;
      raster
        .getContext("2d")!
        .drawImage(image, 0, 0, raster.width, raster.height);
      pixels = raster;
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    const tex = {
      texture,
      width: image.naturalWidth,
      height: image.naturalHeight,
      source,
    };
    textures.set(image, tex);
    return tex;
  }
  function resize() {
    const w = root.clientWidth,
      h = root.clientHeight;
    if (!w || !h) return false;
    const dpr = Math.min(
      devicePixelRatio,
      crtSettings.maxDpr,
      Math.sqrt(crtSettings.maxPixels / (w * h)),
    );
    const rw = Math.round(w * dpr),
      rh = Math.round(h * dpr);
    if (rw !== width || rh !== height) {
      width = rw;
      height = rh;
      canvas.width = rw;
      canvas.height = rh;
      bindTexture(frameTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        rw,
        rh,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        frameTexture,
        0,
      );
    }
    return true;
  }
  function quad(
    tex: Tex,
    x: number,
    y: number,
    w: number,
    h: number,
    crop: [number, number, number, number] = [0, 0, 1, 1],
    radius = 0,
    focus = false,
  ) {
    if (w <= 0 || h <= 0) return;
    gl.bindTexture(gl.TEXTURE_2D, tex.texture);
    gl.uniform4f(s.uRect, x, y, w, h);
    gl.uniform4f(s.uCrop, ...crop);
    gl.uniform2f(s.uRectSize, w, h);
    gl.uniform1f(s.uRadius, radius);
    gl.uniform1f(s.uFocus, focus ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function drawTicker(
    node: HTMLElement,
    rootRect: DOMRect,
    sx: number,
    sy: number,
    time: number,
  ) {
    const r = node.getBoundingClientRect();
    if (r.bottom < rootRect.top || r.top > rootRect.bottom) return;
    const key = Math.round(r.width) + "/" + node.textContent;
    if (!ticker || tickerKey !== key) {
      if (ticker) gl.deleteTexture(ticker.texture);
      tickerKey = key;
      const surface = document.createElement("canvas");
      surface.width = 2400;
      surface.height = 120;
      const ctx = surface.getContext("2d")!;
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, 2400, 120);
      ctx.fillStyle = "#fff";
      ctx.font = '900 64px "Barlow Condensed",sans-serif';
      ctx.textBaseline = "middle";
      const text =
        "HEY, I’M AYUSH. I MAKE GAMES, WEBSITES, AND MOBILE APPS.  ✳  ";
      ctx.fillText(text + text, 0, 62);
      const texture = gl.createTexture()!;
      bindTexture(texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        surface,
      );
      ticker = { texture, width: 2400, height: 120, source: "ticker" };
    }
    // The offscreen broadcast remains part of the same warped GPU scene when found.
    const x = (r.left - rootRect.left) * sx,
      y = (r.top - rootRect.top) * sy,
      w = r.width * sx,
      h = r.height * sy;
    quad(ticker, x, y, w, h, [(time * 0.000015) % 0.45, 0, 0.55, 1]);
  }
  return {
    render(time: number) {
      if (!resize()) return;
      const reduced = matchMedia("(prefers-reduced-motion:reduce)").matches;
      const w = root.clientWidth,
        h = root.clientHeight,
        r = root.getBoundingClientRect(),
        sx = w / r.width,
        sy = h / r.height;
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.viewport(0, 0, width, height);
      gl.clearColor(0.066, 0.066, 0.066, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(scene);
      gl.bindVertexArray(vaoScene);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(s.uImage, 0);
      gl.uniform2f(s.uSize, w, h);
      const images = root.matches(".identity-scene")
        ? root.querySelectorAll<HTMLImageElement>(".studio-artwork")
        : root.querySelectorAll<HTMLImageElement>(
            ".board img,.identity-boot img",
          );
      const present = new Set(images);
      for (const [image, tex] of textures)
        if (!present.has(image)) {
          gl.deleteTexture(tex.texture);
          textures.delete(image);
        }
      for (const image of images) {
        const tex = textureFor(image);
        if (!tex) continue;
        const box = image.getBoundingClientRect();
        if (
          box.right < r.left ||
          box.left > r.right ||
          box.bottom < r.top ||
          box.top > r.bottom
        )
          continue;
        const x = (box.left - r.left) * sx,
          y = (box.top - r.top) * sy,
          rw = box.width * sx,
          rh = box.height * sy;
        const fit = getComputedStyle(image).objectFit,
          position = getComputedStyle(image)
            .objectPosition.split(" ")
            .map((v) => parseFloat(v) / 100);
        let crop: [number, number, number, number] = [0, 0, 1, 1];
        const ratio = rw / rh,
          natural = tex.width / tex.height;
        if (fit === "cover") {
          if (natural > ratio) {
            const span = ratio / natural;
            crop = [(1 - span) * (position[0] || 0.5), 0, span, 1];
          } else {
            const span = natural / ratio;
            crop = [0, (1 - span) * (position[1] || 0.5), 1, span];
          }
        }
        const button = image.closest("button"),
          focus = !!button?.matches(":focus-visible");
        quad(
          tex,
          x,
          y,
          rw,
          rh,
          crop,
          image.closest(".identity-trigger") ? Math.min(rw, rh) * 0.035 : 0,
          focus,
        );
      }
      const broadcast = root.querySelector<HTMLElement>(".board-broadcast");
      if (broadcast) drawTicker(broadcast, r, sx, sy, reduced ? 0 : time);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      gl.disable(gl.BLEND);
      gl.useProgram(glass);
      gl.bindVertexArray(vaoGlass);
      gl.bindTexture(gl.TEXTURE_2D, frameTexture);
      gl.uniform1i(g.uScene, 0);
      gl.uniform2f(g.uResolution, w, h);
      gl.uniform1f(g.uTime, time / 1000);
      const board = root.querySelector<HTMLElement>(".board");
      gl.uniform2f(
        g.uPull,
        reduced ? 0 : Number(board?.style.getPropertyValue("--pull-x") || 0),
        reduced ? 0 : Number(board?.style.getPropertyValue("--pull-y") || 0),
      );
      gl.uniform1f(g.uCurvature, crtSettings.curvature);
      gl.uniform1f(g.uChroma, reduced ? 0.0003 : crtSettings.chroma);
      gl.uniform1f(g.uScan, reduced ? 0.025 : crtSettings.scanlines);
      gl.uniform1f(g.uGrain, reduced ? 0 : crtSettings.grain);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      canvas.dataset.gpuError = String(gl.getError());
    },
    dispose() {
      textures.forEach((t) => gl.deleteTexture(t.texture));
      if (ticker) gl.deleteTexture(ticker.texture);
      gl.deleteTexture(frameTexture);
      gl.deleteFramebuffer(framebuffer);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vaoScene);
      gl.deleteVertexArray(vaoGlass);
      gl.deleteProgram(scene);
      gl.deleteProgram(glass);
    },
  };
}
