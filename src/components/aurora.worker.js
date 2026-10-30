// Aurora WebGL di Web Worker (OffscreenCanvas): pembuatan konteks WebGL (±175 ms, sinkron)
// dan render tiap frame tidak memblokir main thread.
// Pesan masuk: init {canvas,width,height} | resize {width,height} | pointer {x,y} | start | stop
// Pesan keluar: 'ready' (frame pertama tergambar) | 'off' (WebGL tidak tersedia / konteks hilang)

const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}'

// fbm + domain warp membentuk pita cahaya biru-cyan, glow di sekitar pointer.
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_pointer;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = r * p * 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  float t = u_time * 0.05;

  vec2 q = vec2(fbm(p * 1.4 + vec2(0.0, t)), fbm(p * 1.4 + vec2(5.2, -t)));
  float n = fbm(p * 1.1 + 1.8 * q + vec2(t * 0.8, 0.0));

  float yc = 0.18 + 0.16 * sin(p.x * 1.3 + t * 4.0) + 0.3 * (q.y - 0.5);
  float d = (p.y - yc) * 2.2;
  float band = exp(-d * d);
  float rays = fbm(vec2(p.x * 5.0 + t * 3.0, p.y * 0.7));
  float a = band * (0.3 + 1.1 * rays) * smoothstep(0.3, 0.8, n);

  vec3 base = vec3(0.020, 0.020, 0.063);
  vec3 deep = vec3(0.114, 0.306, 0.847);
  vec3 blue = vec3(0.173, 0.404, 0.929);
  vec3 cyan = vec3(0.0, 0.941, 1.0);
  vec3 violet = vec3(0.486, 0.227, 0.929);

  vec3 col = base + deep * 0.22 * n;
  col = mix(col, blue, clamp(a * 1.35, 0.0, 1.0));
  col = mix(col, cyan, clamp(a * a * 1.2, 0.0, 1.0));
  col += violet * 0.16 * smoothstep(0.45, 0.9, q.x) * (1.0 - uv.y);

  vec2 m = (u_pointer * u_res - 0.5 * u_res) / u_res.y;
  col += mix(blue, cyan, 0.35) * exp(-5.0 * dot(p - m, p - m)) * 0.22;

  col *= 1.0 - 0.4 * length(uv - vec2(0.55, 0.6));
  col = mix(base, col, smoothstep(0.0, 0.25, uv.y));
  col += (hash(gl_FragCoord.xy + fract(u_time)) - 0.5) * 0.03;

  gl_FragColor = vec4(col, 1.0);
}
`

const nextFrame = self.requestAnimationFrame
  ? (fn) => self.requestAnimationFrame(fn)
  : (fn) => setTimeout(() => fn(performance.now()), 16)
const cancelFrame = self.cancelAnimationFrame ? (id) => self.cancelAnimationFrame(id) : clearTimeout

const pointer = { x: 0.7, y: 0.6, tx: 0.7, ty: 0.6 }
const t0 = performance.now()
let gl, uTime, uRes, uPointer
let raf = 0

function createProgram() {
  const prog = gl.createProgram()
  for (const [type, src] of [
    [gl.VERTEX_SHADER, VERT],
    [gl.FRAGMENT_SHADER, FRAG],
  ]) {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    gl.attachShader(prog, shader)
  }
  gl.linkProgram(prog)
  return gl.getProgramParameter(prog, gl.LINK_STATUS) ? prog : null
}

function draw(now) {
  pointer.x += (pointer.tx - pointer.x) * 0.05
  pointer.y += (pointer.ty - pointer.y) * 0.05
  gl.uniform1f(uTime, (now - t0) / 1000)
  gl.uniform2f(uPointer, pointer.x, pointer.y)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
}

function loop(now) {
  draw(now)
  raf = nextFrame(loop)
}

function stop() {
  cancelFrame(raf)
  raf = 0
}

function resize(width, height) {
  gl.canvas.width = width
  gl.canvas.height = height
  gl.viewport(0, 0, width, height)
  gl.uniform2f(uRes, width, height)
  draw(performance.now())
}

function init({ canvas, width, height }) {
  gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
  const prog = gl && createProgram()
  if (!prog) {
    gl = null
    postMessage('off')
    return
  }
  canvas.addEventListener('webglcontextlost', () => {
    stop()
    gl = null
    postMessage('off')
  })

  gl.useProgram(prog)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const attr = gl.getAttribLocation(prog, 'p')
  gl.enableVertexAttribArray(attr)
  gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0)
  uTime = gl.getUniformLocation(prog, 'u_time')
  uRes = gl.getUniformLocation(prog, 'u_res')
  uPointer = gl.getUniformLocation(prog, 'u_pointer')

  resize(width, height)
  postMessage('ready')
}

self.onmessage = ({ data }) => {
  if (data.type === 'init') return init(data)
  if (!gl) return
  if (data.type === 'resize') resize(data.width, data.height)
  else if (data.type === 'pointer') {
    pointer.tx = data.x
    pointer.ty = data.y
  } else if (data.type === 'start') {
    if (!raf) raf = nextFrame(loop)
  } else if (data.type === 'stop') stop()
}
