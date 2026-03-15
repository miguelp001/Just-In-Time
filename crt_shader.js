// CRT Shader Pipeline
const CustomPipeline = new Phaser.Class({

    Extends: Phaser.Renderer.WebGL.Pipelines.PostFXPipeline,

    initialize:

    function CustomPipeline (game)
    {
        Phaser.Renderer.WebGL.Pipelines.PostFXPipeline.call(this, {
            game: game,
            renderTarget: true,
            fragShader: `
            #ifdef GL_FRAGMENT_PRECISION_HIGH
            precision highp float;
            #else
            precision mediump float;
            #endif

            uniform sampler2D uMainSampler;
            uniform float time;
            varying vec2 outTexCoord;

            // CRT parameters mapped to realistic monitor curvature & scanlines
            vec2 curve(vec2 uv)
            {
                uv = (uv - 0.5) * 2.0;
                uv *= 1.1;	
                uv.x *= 1.0 + pow((abs(uv.y) / 5.0), 2.0);
                uv.y *= 1.0 + pow((abs(uv.x) / 4.0), 2.0);
                uv  = (uv / 2.0) + 0.5;
                uv =  uv *0.92 + 0.04;
                return uv;
            }

            void main(void)
            {
                vec2 q = outTexCoord;
                vec2 uv = curve(outTexCoord);
                vec3 col;
                
                // Out of screen bounds -> black
                if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0)
                {
                    col = vec3(0.0, 0.0, 0.0);
                }
                else
                {
                    // Sample texture
                    col = texture2D(uMainSampler, vec2(uv.x, uv.y)).rgb;
                    
                    // Subtle chromatic aberration
                    col.r = texture2D(uMainSampler, vec2(uv.x+0.003,uv.y)).x;
                    col.g = texture2D(uMainSampler, vec2(uv.x+0.000,uv.y)).y;
                    col.b = texture2D(uMainSampler, vec2(uv.x-0.003,uv.y)).z;

                    // Scanlines (Reduced intensity for legibility)
                    col *= clamp(0.85 + 0.15*sin(uv.y * 800.0), 0.0, 1.0);
                    
                    // Vignette
                    float vig = (0.0 + 1.0*16.0*uv.x*uv.y*(1.0-uv.x)*(1.0-uv.y));
                    col *= vec3(pow(vig, 0.3));
                    
                    // Boost green channel slightly for retro feel
                    col.g *= 1.1;
                }

                gl_FragColor = vec4(col, 1.0);
            }
            `
        });
    }
});
