export const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const fragmentShader = `
precision highp float;
precision highp int;

varying vec2 vUv;

uniform sampler2D tPrevious;
uniform float uFrame;
uniform vec2 uResolution;
uniform vec3 uCameraPos;
uniform vec3 uCameraDir;
uniform vec3 uCameraUp;
uniform vec3 uCameraRight;
uniform float uSeed;
uniform float uLightIntensity;

#define PI 3.14159265359
#define MAX_BOUNCES 12
#define EPSILON 0.001
#define INFINITY 10000.0

// --- Structures ---
struct Ray {
    vec3 origin;
    vec3 direction;
};

struct Material {
    int type; // 0: Lambertian, 1: Mirror, 2: Light, 3: Glass
    vec3 albedo;
    vec3 emission;
};

struct Hit {
    float t;
    vec3 point;
    vec3 normal;
    int matIndex;
};

struct Sphere {
    vec3 center;
    float radius;
    int matIndex;
};

struct Box {
    vec3 min;
    vec3 max;
    int matIndex;
};

// --- Helper Functions ---
vec3 rotateX(vec3 v, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec3(v.x, c * v.y - s * v.z, s * v.y + c * v.z);
}

vec3 rotateY(vec3 v, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z);
}

vec3 rotateZ(vec3 v, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec3(c * v.x - s * v.y, s * v.x + c * v.y, v.z);
}

// --- Scene Data ---
Material getMaterial(int index) {
    Material m;
    m.type = 0; m.albedo = vec3(0.0); m.emission = vec3(0.0);
    
    if (index == 0) { // White Diffuse
        m.type = 0; m.albedo = vec3(0.73, 0.73, 0.73);
    } else if (index == 1) { // Red Diffuse
        m.type = 0; m.albedo = vec3(0.65, 0.05, 0.05);
    } else if (index == 2) { // Green Diffuse
        m.type = 0; m.albedo = vec3(0.12, 0.45, 0.15);
    } else if (index == 3) { // Light
        m.type = 2; m.albedo = vec3(0.0); m.emission = vec3(uLightIntensity);
    } else if (index == 4) { // Mirror (Tall Box)
    m.type = 1; m.albedo = vec3(0.95, 0.95, 0.95);
    } else if (index == 5) { // Blue Diffuse
        m.type = 0; m.albedo = vec3(0.1, 0.1, 0.7);
    } else if (index == 6) { // Gold Diffuse (Floating Sphere)
        m.type = 0; m.albedo = vec3(1.0, 0.78, 0.34);
    } else if (index == 7) { // Short Box - 改为蓝色漫反射
    m.type = 0; m.albedo = vec3(0.9, 0.95, 1.0);
    } else if (index == 8) { // Glass (New Sphere)
        m.type = 3; m.albedo = vec3(1.0, 1.0, 1.0);
    } else if (index == 12) { // Microfacet (蓝金金属)
        m.type = 7; m.albedo = vec3(0.4, 0.6, 0.7);
    }
    return m;
}

// --- Random Number Generator ---
float hash(float p) {
    p = fract(p * .1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

float rand(inout float seed) {
    float result = hash(seed);
    seed += 1.0;
    return result;
}

vec3 randomCosineDirection(inout float seed) {
    float r1 = rand(seed);
    float r2 = rand(seed);
    float z = sqrt(1.0 - r2);
    float phi = 2.0 * PI * r1;
    float x = cos(phi) * sqrt(r2);
    float y = sin(phi) * sqrt(r2);
    return vec3(x, y, z);
}

vec3 toWorld(vec3 localDir, vec3 normal) {
    vec3 a = (abs(normal.x) > 0.9) ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 v = normalize(cross(normal, a));
    vec3 u = cross(normal, v);
    return v * localDir.x + u * localDir.y + normal * localDir.z;
}

// --- Intersection Functions ---
float intersectSphere(Ray r, Sphere s) {
    vec3 oc = r.origin - s.center;
    float a = dot(r.direction, r.direction);
    float b = 2.0 * dot(oc, r.direction);
    float c = dot(oc, oc) - s.radius * s.radius;
    float discriminant = b * b - 4.0 * a * c;
    if (discriminant < 0.0) return INFINITY;
    float t = (-b - sqrt(discriminant)) / (2.0 * a);
    if (t > EPSILON) return t;
    return INFINITY;
}

float intersectBox(Ray r, Box b) {
    vec3 invDir = 1.0 / r.direction;
    vec3 tmin = (b.min - r.origin) * invDir;
    vec3 tmax = (b.max - r.origin) * invDir;
    vec3 t1 = min(tmin, tmax);
    vec3 t2 = max(tmin, tmax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    if (tNear > tFar || tFar < 0.0) return INFINITY;
    if (tNear > EPSILON) return tNear;
    if (tFar > EPSILON) return tFar;
    return INFINITY;
}

vec3 getBoxNormal(vec3 p, Box b) {
    vec3 c = (b.min + b.max) * 0.5;
    vec3 d = (b.max - b.min) * 0.5;
    vec3 localPos = p - c;
    vec3 normal = vec3(0.0);
    float bias = 1.0001;
    if (abs(localPos.x) >= d.x / bias) normal.x = sign(localPos.x);
    else if (abs(localPos.y) >= d.y / bias) normal.y = sign(localPos.y);
    else if (abs(localPos.z) >= d.z / bias) normal.z = sign(localPos.z);
    return normalize(normal);
}

// --- Scene Intersection ---
Hit intersectScene(Ray r) {
    Hit hit;
    hit.t = INFINITY;
    hit.matIndex = -1;

    // --- Room (Expanded Depth to 800) ---
    // Floor
    Box floorBox = Box(vec3(0.0, -10.0, 0.0), vec3(555.0, 0.0, 800.0), 0);
    float t = intersectBox(r, floorBox);
    if (t < hit.t) { hit.t = t; hit.matIndex = 0; hit.normal = getBoxNormal(r.origin + r.direction * t, floorBox); }

    // Ceiling
    Box ceilBox = Box(vec3(0.0, 555.0, 0.0), vec3(555.0, 565.0, 800.0), 0);
    t = intersectBox(r, ceilBox);
    if (t < hit.t) { hit.t = t; hit.matIndex = 0; hit.normal = getBoxNormal(r.origin + r.direction * t, ceilBox); }

    // Back Wall (Moved to Z=800)
    Box backBox = Box(vec3(0.0, 0.0, 800.0), vec3(555.0, 555.0, 810.0), 0);
    t = intersectBox(r, backBox);
    if (t < hit.t) { hit.t = t; hit.matIndex = 0; hit.normal = getBoxNormal(r.origin + r.direction * t, backBox); }

    // Left Wall (Red)
    Box leftBox = Box(vec3(555.0, 0.0, 0.0), vec3(565.0, 555.0, 800.0), 1);
    t = intersectBox(r, leftBox);
    if (t < hit.t) { hit.t = t; hit.matIndex = 1; hit.normal = getBoxNormal(r.origin + r.direction * t, leftBox); }

    // Right Wall (Green)
    Box rightBox = Box(vec3(-10.0, 0.0, 0.0), vec3(0.0, 555.0, 800.0), 2);
    t = intersectBox(r, rightBox);
    if (t < hit.t) { hit.t = t; hit.matIndex = 2; hit.normal = getBoxNormal(r.origin + r.direction * t, rightBox); }

    // --- Light (Centered in new depth) ---
   
    Box lightBox = Box(vec3(180.0, 554.0, 300.0), vec3(375.0, 555.0, 500.0), 3);
    t = intersectBox(r, lightBox);
    if (t < hit.t) { hit.t = t; hit.matIndex = 3; hit.normal = vec3(0.0, -1.0, 0.0); }

    // --- Tall Box (Mirror, Rotated Y) ---
    // Center: (345, 165, 375) -> Size: (160, 330, 160)
    vec3 tallCenter = vec3(265.0, 200.0, 375.0);
    vec3 tallSize = vec3(160.0, 300.0, 160.0);
    float tallAngle = radians(-66.0); // More slanted for one vertex touching ground
    
    // Transform Ray to Local Space
    vec3 localOriginTall = r.origin - tallCenter;
    localOriginTall = rotateY(localOriginTall, -tallAngle);
    vec3 localDirTall = rotateY(r.direction, -tallAngle);
    Ray localRayTall = Ray(localOriginTall, localDirTall);
    
    Box localTallBox = Box(tallSize * -0.5, tallSize * 0.5, 4); // 4 = 漫反射
    t = intersectBox(localRayTall, localTallBox);
    if (t < hit.t) {
        hit.t = t;
        hit.matIndex = 4;
        vec3 localNormal = getBoxNormal(localRayTall.origin + localRayTall.direction * t, localTallBox);
        hit.normal = rotateY(localNormal, tallAngle); // Rotate normal back
    }

    // --- Short Box (Matte, Tilted/Cocking up one foot) ---
    // Center: (210, 82.5, 145) -> Size: (160, 165, 160)
    vec3 shortCenter = vec3(180.0, 140.0, 205.0); // Raised higher for better visibility
    vec3 shortSize = vec3(80.0, 80.0, 80.0);
    float shortAngleY = radians(45.0);
    float shortAngleX = radians(45.0); // Tilt up
    float shortAngleZ = radians(0.0); // No sideways tilt
    
    // Transform Ray: Translate -> Rotate Y -> Rotate X -> Rotate Z (Order matters for inverse)
    // Inverse: InvZ -> InvX -> InvY
    vec3 localOriginShort = r.origin - shortCenter;
    localOriginShort = rotateZ(localOriginShort, -shortAngleZ);
    localOriginShort = rotateX(localOriginShort, -shortAngleX);
    localOriginShort = rotateY(localOriginShort, -shortAngleY);
    
    vec3 localDirShort = r.direction;
    localDirShort = rotateZ(localDirShort, -shortAngleZ);
    localDirShort = rotateX(localDirShort, -shortAngleX);
    localDirShort = rotateY(localDirShort, -shortAngleY);
    
    Ray localRayShort = Ray(localOriginShort, localDirShort);
    Box localShortBox = Box(shortSize * -0.5, shortSize * 0.5, 7); // 7 = Matte Grey
    
    t = intersectBox(localRayShort, localShortBox);
    if (t < hit.t) {
        hit.t = t;
        hit.matIndex = 7;
        vec3 localNormal = getBoxNormal(localRayShort.origin + localRayShort.direction * t, localShortBox);
        // Transform Normal Back: RotY -> RotX -> RotZ
        vec3 worldNormal = rotateY(localNormal, shortAngleY);
        worldNormal = rotateX(worldNormal, shortAngleX);
        worldNormal = rotateZ(worldNormal, shortAngleZ);
        hit.normal = worldNormal;
    }

    // --- Glass Sphere (New) ---
    // Smaller (60) and Higher (150)
    Sphere glassSphere = Sphere(vec3(450.0, 350.0, 380.0), 80.0, 8); // 8 = Glass
    t = intersectSphere(r, glassSphere);
    if (t < hit.t) { hit.t = t; hit.matIndex = 8; hit.normal = normalize((r.origin + r.direction * t) - glassSphere.center); }

    // --- Floating Gold Sphere (Moved slightly) ---
    Sphere floatS = Sphere(vec3(70.0, 450.0, 400.0), 60.0, 6);
    t = intersectSphere(r, floatS);
    if (t < hit.t) { hit.t = t; hit.matIndex = 6; hit.normal = normalize((r.origin + r.direction * t) - floatS.center); }

    if (hit.t < INFINITY) {
        hit.point = r.origin + r.direction * hit.t;
    }

    return hit;
}

// --- Next Event Estimation ---
vec3 sampleLight(vec3 origin, vec3 normal, inout float seed) {
    // Updated Light Bounds
    vec3 lightMin = vec3(180.0, 554.0, 300.0);
    vec3 lightMax = vec3(375.0, 555.0, 500.0);
    vec3 lightEmission = vec3(uLightIntensity);
    float lightArea = (lightMax.x - lightMin.x) * (lightMax.z - lightMin.z);
    
    float r1 = rand(seed);
    float r2 = rand(seed);
    vec3 lightPoint = vec3(
        mix(lightMin.x, lightMax.x, r1),
        554.0,
        mix(lightMin.z, lightMax.z, r2)
    );
    
    vec3 lightDir = lightPoint - origin;
    float distSquared = dot(lightDir, lightDir);
    float dist = sqrt(distSquared);
    lightDir /= dist;
    
    float NdotL = dot(normal, lightDir);
    if (NdotL <= 0.0) return vec3(0.0);
    
    float LdotN = dot(-lightDir, vec3(0.0, -1.0, 0.0));
    if (LdotN <= 0.0) return vec3(0.0);
    
    Ray shadowRay = Ray(origin + normal * EPSILON, lightDir);
    Hit shadowHit = intersectScene(shadowRay);
    
    if (shadowHit.t < dist - 0.1) {
        return vec3(0.0);
    }
    
    float G = (NdotL * LdotN) / distSquared;
    return lightEmission * G * lightArea;
}

// --- Path Tracing ---
vec3 trace(Ray r, inout float seed) {
    vec3 radiance = vec3(0.0);
    vec3 throughput = vec3(1.0);

    for (int i = 0; i < MAX_BOUNCES; i++) {
        Hit hit = intersectScene(r);

        if (hit.t == INFINITY) {
            // Add some environment light to avoid complete black
            return vec3(0.01); // Very dim ambient light
        }

        Material mat = getMaterial(hit.matIndex);

        if (mat.type == 2) { // Light
            if (i == 0) {
                radiance += throughput * mat.emission;
            }
            break;
        }

        // Next Event Estimation for Diffuse
        if (mat.type == 0) { 
            vec3 directLight = sampleLight(hit.point, hit.normal, seed);
            radiance += throughput * (mat.albedo / PI) * directLight;
        }

        // Russian Roulette
        if (i > 3) {
            float p = max(throughput.r, max(throughput.g, throughput.b));
            if (rand(seed) > p) break;
            throughput /= p;
        }

        vec3 nextDir;
        if (mat.type == 0) { // Lambertian
            vec3 target = randomCosineDirection(seed);
            nextDir = toWorld(target, hit.normal);
            throughput *= mat.albedo;
            r.origin = hit.point + hit.normal * EPSILON;
        } else if (mat.type == 1) { // Mirror
            nextDir = reflect(r.direction, hit.normal);
            throughput *= mat.albedo;
            r.origin = hit.point + hit.normal * EPSILON;
        } else if (mat.type == 7) { // Microfacet (粗糙金属)
            // 简化的Microfacet模型 - 基于GGX分布
            float roughness = 0.1;
            float alpha = roughness * roughness;
            
            // 采样微表面法线
            float r1 = rand(seed);
            float r2 = rand(seed);
            float phi = 2.0 * PI * r1;
            float cosTheta = sqrt((1.0 - r2) / (1.0 + (alpha * alpha - 1.0) * r2));
            float sinTheta = sqrt(1.0 - cosTheta * cosTheta);
            
            vec3 h = vec3(cos(phi) * sinTheta, sin(phi) * sinTheta, cosTheta);
            h = toWorld(h, hit.normal);
            
            // 计算反射方向
            nextDir = reflect(r.direction, h);
            
            // 简化的几何遮蔽函数
            float NdotH = max(dot(hit.normal, h), 0.0);
            float VdotH = max(dot(-r.direction, h), 0.0);
            float NdotV = max(dot(hit.normal, -r.direction), 0.0);
            float NdotL = max(dot(hit.normal, nextDir), 0.0);
            
            // GGX分布函数
            float alpha2 = alpha * alpha;
            float denom = NdotH * NdotH * (alpha2 - 1.0) + 1.0;
            float D = alpha2 / (PI * denom * denom);
            
            // 几何遮蔽函数 (Smith)
            float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
            float G1L = NdotL / (NdotL * (1.0 - k) + k);
            float G1V = NdotV / (NdotV * (1.0 - k) + k);
            float G = G1L * G1V;
            
            // 菲涅尔反射率 (Schlick近似)
            vec3 F0 = mat.albedo;
            vec3 F = F0 + (1.0 - F0) * pow(1.0 - VdotH, 5.0);
            
            // BRDF
            vec3 brdf = (F * G * D) / (4.0 * NdotV * NdotL + 0.001);
            
            throughput *= brdf * NdotL * PI;
            r.origin = hit.point + hit.normal * EPSILON;
        } else if (mat.type == 3) { // Glass (Dielectric)
            vec3 outwardNormal;
            float ni_over_nt;
            float cosine;
            
            if (dot(r.direction, hit.normal) > 0.0) {
                outwardNormal = -hit.normal;
                ni_over_nt = 1.5; // Glass / Air
                cosine = 1.5 * dot(r.direction, hit.normal); // Approximation
            } else {
                outwardNormal = hit.normal;
                ni_over_nt = 1.0 / 1.5; // Air / Glass
                cosine = -dot(r.direction, hit.normal);
            }
            
            vec3 refracted = refract(r.direction, outwardNormal, ni_over_nt);
            float reflectProb;
            
            if (length(refracted) > 0.0) {
                // Schlick Approximation
                float r0 = (1.0 - 1.5) / (1.0 + 1.5);
                r0 = r0 * r0;
                reflectProb = r0 + (1.0 - r0) * pow((1.0 - cosine), 5.0);
            } else {
                reflectProb = 1.0; // Total Internal Reflection
            }
            
            if (rand(seed) < reflectProb) {
                nextDir = reflect(r.direction, hit.normal);
                r.origin = hit.point + hit.normal * EPSILON;
            } else {
                nextDir = refracted;
                r.origin = hit.point - hit.normal * EPSILON; // Move inside
            }
            throughput *= mat.albedo; // Usually 1.0 for glass
        }

        r.direction = nextDir;
    }

    return radiance;
}

void main() {
    float seed = uSeed + dot(vUv, vec2(12.9898, 78.233));

    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;

    vec3 rayDir = normalize(uCameraDir + uv.x * uCameraRight + uv.y * uCameraUp);
    Ray ray = Ray(uCameraPos, rayDir);

    vec3 color = trace(ray, seed);
    
    // Aggressive clamping during preview (first few frames) to kill fireflies
    if (uFrame < 10.0) {
        color = min(color, vec3(0.8)); // Very low clamp for stability
    } else {
        color = min(color, vec3(10.0)); // Relaxed clamp for accumulation
    }

    vec3 prevColor = texture2D(tPrevious, vUv).rgb;
    
    float weight = 1.0 / (uFrame + 1.0);
    vec3 finalColor = mix(prevColor, color, weight);

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

// 添加一个空的默认导出，使这个文件被识别为一个模块
export default {};