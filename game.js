// {{ Drawing Library }} \\
const Canvas = document.getElementById("Screen"),CTX=Canvas.getContext("2d");
const Vector = function(x,y){this.x=x,this.y=y}
Vector.prototype.toString = function(){return `${this.x}, ${this.y}`}
const Color = function(r,g,b,a){this.r=r,this.g=g,this.b=b,this.a=a}
Color.prototype.toString = function(){return `${this.r}, ${this.g}, ${this.b}`}
const Reference = Object.freeze({
	Bin:{},
    Recycle:function(a,b){!this.Bin.hasOwnProperty(a)&&(this.Bin[a]=b)},
    Dig:function(a){return this.Bin.hasOwnProperty(a) ? this.Bin[a] : undefined},
    Dump:function(a){this.Bin.hasOwnProperty(a)&&(delete this.Bin[a])},
	Size:new Vector(448,448),
    BaseSize:new Vector(64,64),
    BasePixelSize:new Vector(1,1),
    GetPixelSize:function(){let Result = this.Dig("PixelSize");if (Result){return Result}Result = new Vector((this.Size.x/this.BaseSize.x)*this.BasePixelSize.x,(this.Size.y/this.BaseSize.y)*this.BasePixelSize.y);this.Recycle("PixelSize",Result);return Result},
    SetColor:function(Color){this.Dump("PixelColor");this.Recycle("PixelColor",Color);return true},
    GetColor:function(){return this.Dig("PixelColor")||(this.SetColor(new Color(0,0,0))&&this.GetColor())},
    Draw:function(x,y){let PixelSize = this.GetPixelSize(),Color = this.GetColor();CTX.beginPath();CTX.fillStyle = `rgba(${Color.r},${Color.g},${Color.b},${Color.a!==undefined?Color.a:1})`;CTX.fillRect(x*PixelSize.x,y*PixelSize.y,PixelSize.x,PixelSize.y)},
    Setup:function(){Canvas.height = this.Size.y;Canvas.width = this.Size.x},
    Clear:function(){CTX.fillStyle = "rgba(255,255,255,1)";CTX.fillRect(0,0,Canvas.width,Canvas.height)},
    GetPixels:function(a){a=String(a).toLowerCase();if (!["x","y"].includes(a)){return}let PixelSize=this.GetPixelSize();return Math.floor(this.Size[a]/PixelSize[a])},
    Background:function(){
    	let Color = this.GetColor();
        CTX.beginPath();
        CTX.fillStyle = `rgba(${Color.r},${Color.g},${Color.b},${Color.a!==undefined?Color.a:1})`;
        CTX.fillRect(0,0,this.Size.x,this.Size.y)
    },
    DrawShade:function(x,y,a,b,c){
    	let PixelSize = this.GetPixelSize();
        CTX.beginPath();
        CTX.fillStyle = `rgba(0,0,0,${c})`;
        CTX.fillRect(x*PixelSize.x,y*PixelSize.y,PixelSize.x*a,PixelSize.y*b);
    },
});

// {{ Game Library }} \\

// -- {{ ~==~ }} -- Global Functions -- {{ ~==~ }} -- \\

async function wait(x){
	await new Promise((resolve,reject)=>{
    	setTimeout(()=>{
        	resolve();
        },x*1000);
    })
};

// -- {{ ~==~ }} -- Input Classes -- {{ ~==~ }} -- \\

class InputBase {
	#Type = "Type";
    #KeyName = "Unknown";
    #Action = "Action";
    #X = 0;
    #Y = 0;
    #MouseType = "Unknown";
	constructor(Type="Unknown",Action="Unknown",KeyName="Unknown",X=0,Y=0,MouseType="Unknown"){
    	this.#Type = Type;
        this.#KeyName = KeyName;
        this.#Action = Action;
        this.#X = X;
        this.#Y = Y;
        this.#MouseType = MouseType;
    };
    get KeyName(){
    	return this.#KeyName;
    };
    get Type(){
    	return this.#Type;
    };
    get Action(){
    	return this.#Action;
    };
    get X(){
    	return this.#X;
    };
    get Y(){
    	return this.#Y;
    };
    get MouseType(){
    	return this.#MouseType;
    };
    toString(){
    	return `Input_${this.#Type}_${this.#Action}`;
    };
};

// -- {{ ~==~ }} -- Proxy Classes -- {{ ~==~ }} -- \\

const Classes = Object.freeze({
	Proxy:{
    	Properties:{
        	Public:{
            	Name:{
                	Value:"Proxy",
                    CanGet:true,
                    CanSet:true,
                },
                ClassName:{
                	Value:"Proxy",
                    CanGet:true,
                    CanSet:false,
                },
                Parent:{
                	Value:undefined,
                    CanGet:true,
                    CanSet:true,
                    OnSet:function(Properties,Value){
                    	if (!(Value instanceof Proxy) && Value !== null){return false}
                        if (Properties.Private.ParentLocked == true){
                            throw Error("Attempt to set Parent property of a Proxy with ParentLocked!");
                            return false;
                        }
                        if (this.GetChildren().includes(Value)){return false}
                        let Parent = Properties.Public.Parent.Value;
                        if (Parent){
                        	Parent.RemoveChild(this);
                        }
                        if (Value === null){return true};
                        if (!Value.GetChildren().includes(this)){
                        	Value.AddChild(this);
                            return false;
                        } else {
                        	if (Properties.Private.Lock == true){
                            	Properties.Private.ParentLocked = true;
                        	}
                        }
                        return true;
                    },
                },
                IsA:{
                	Value:function(Properties,Type){
                    	let Types = ClassReference.GetTypes(this.ClassName);
                        return Types.includes(Type);
                    },
                    CanGet:true,
                    CanSet:false,
                },
                AddChild:{
                	Value:function(Properties,Child){
                    	if (Properties.Private.Removed){return}
                    	let Children = Properties.Private.Children;
                        if (Children.includes(Child)){return};
                        if (Child.Removed){return};
                        Children.push(Child);
                        Properties.Events.ChildAdded.Private.Fire(Child);
                        Child.Parent = this;
                    },
                    CanGet:true,
                    CanSet:false,
                },
                RemoveChild:{
                	Value:function(Properties,Child){
                    	let Children = Properties.Private.Children;
                        if (!Children.includes(Child)){return};
                        Children.splice(Children.indexOf(Child),1);
                        if (Child.Parent !== null){
                        	Child.Parent = null;
                        }
                        Properties.Events.ChildRemoved.Private.Fire(Child)
                    },
                    CanGet:true,
                    CanSet:false,
                },
                FindFirstChild:{
                	Value:function(Properties,Name){
                    	let Children = Properties.Private.Children;
                        for (let Child of Children){
                        	if (Child.Name == Name){
                            	return Child
                            }
                        }
                    },
                    CanGet:true,
                    CanSet:false,
                },
                WaitForChild:{
                	Value:async function(Properties,Name,Time){
                    	let Self = this;
                        Time = Time !== undefined ? Time : 5;
                    	let Results = await new Promise(async (resolve,reject)=>{
                        	let Child = Self.FindFirstChild(Name);
                            let Start = Date.now()/1000;
                            while (!Child){
                            	Child = Self.FindFirstChild(Name);
                                if ((Date.now()/1000) - Start > Time && !Child){
                                	Child = "Not found under given time";
                                	break;
                                }
                                await wait(0.05);
                            }
                            resolve(Child);
                        }).then((...Args)=>{
                        	return Args;
                        })
                        return Results;
                    },
                    CanGet:true,
                    CanSet:false,
                },
                WaitForChildOfClassName:{
                	Value:async function(Properties,Name,Time){
                    	let Self = this;
                        Time = Time !== undefined ? Time : 5;
                    	let Results = await new Promise(async (resolve,reject)=>{
                        	let Child = Self.FindFirstChildOfClassName(Name);
                            let Start = Date.now()/1000;
                            while (!Child){
                            	Child = Self.FindFirstChildOfClassName(Name);
                                if ((Date.now()/1000) - Start > Time && !Child){
                                	Child = "Not found under given time";
                                	break;
                                }
                                await wait(0.05);
                            }
                            resolve(Child);
                        }).then((...Args)=>{
                        	return Args;
                        })
                        return Results;
                    },
                    CanGet:true,
                    CanSet:false,
                },
                WaitForChildOfClass:{
                	Value:async function(Properties,Name,Time){
                    	let Self = this;
                        Time = Time !== undefined ? Time : 5;
                    	let Results = await new Promise(async (resolve,reject)=>{
                        	let Child = Self.FindFirstChildOfClass(Name);
                            let Start = Date.now()/1000;
                            while (!Child){
                            	Child = Self.FindFirstChildOfClass(Name);
                                if ((Date.now()/1000) - Start > Time && !Child){
                                	Child = "Not found under given time";
                                	break;
                                }
                                await wait(0.05);
                            }
                            resolve(Child);
                        }).then((...Args)=>{
                        	return Args;
                        })
                        return Results;
                    },
                    CanGet:true,
                    CanSet:false,
                },
                FindFirstChildOfClassName:{
                	Value:function(Properties,Class){
                    	let Children = Properties.Private.Children;
                        for (let Child of Children){
                        	if (Child.ClassName == Class){
                            	return Child
                            }
                        }
                    },
                    CanGet:true,
                    CanSet:false,
                },
                FindFirstChildOfClass:{
                	Value:function(Properties,Class){
                    	let Children = Properties.Private.Children;
                        for (let Child of Children){
                        	if (Child.IsA(Class)){
                            	return Child
                            }
                        }
                    },
                    CanGet:true,
                    CanSet:false,
                },
                RemoveAllChildren:{
                	Value:function(Properties){
                    	let Children = Properties.Private.Children;
                        for (let Child of Children){
                        	Properties.Events.ChildRemoved.Private.Fire(Child)
                            Child.Remove()
                        }
                        Children.splice(0,Children.length)
                    },
                    CanGet:true,
                    CanSet:false,
                },
                GetChildren:{
                	Value:function(Properties){
                    	return Array.of(...Properties.Private.Children);
                    },
                    CanGet:true,
                    CanSet:false,
                },
                Remove:{
                	Value:function(Properties){
                    	if (Properties.Private.Removed){return}
                        if (Properties.Private.ParentLocked == true){
                            throw Error("Attempt to Remove Proxy with ParentLocked");
                        }
                    	for (let Child of Properties.Private.Children){
                        	this.RemoveChild(Child);
                        	Child.Remove();
                        }
                        for (let Event in Properties.Events){
                        	Event = Properties.Events[Event];
                        	for (let Connection of Event.Connections){
                            	Connection.Public.Disconnect()
                            }
                        }
                        if (this.Parent !== null){
                        	this.Parent = null;
                        }
                        Properties.Public.Removed.Value = true;
                        delete this;
                    },
                    CanGet:true,
                    CanSet:false,
                },
                Removed:{
                	Value:false,
                    CanGet:true,
                    CanSet:false,
                }
            },
            Private:{
            	Children:[],
                Removed:false,
            },
            Events:{
            	ChildAdded:undefined,
                ChildRemoved:undefined,
                Changed:undefined,
            },
        },
        CanCreate:false,
        Extends:[],
    },
	Game:{
    	Properties:{
        	Public:{
            	Start:{
                	Value:function(Properties){
                    	if (Properties.Public.Started.Value){return}
                        Properties.Public.Started.Value = true;
                        Properties.Events.OnStart.Private.Fire()
                    },
                    CanGet:true,
                    CanSet:false,
                },
                SetWorld:{
                	Value:function(Properties,World){
                    	if (Properties.Public.World.Value !== undefined){return}
                        if (!(World instanceof Proxy)){return}
                        Properties.Public.World.Value = World;
                        this.AddChild(World);
                        Properties.Events.WorldLoaded.Private.Fire(World);
                    },
                    CanGet:true,
                    CanSet:false,
                },
                World:{
                	Value:undefined,
                    CanGet:true,
                    CanSet:false,
                },
                Started:{
                	Value:false,
                    CanGet:true,
                    CanSet:false
                },
                GetService:{
                	Value:function(Properties,Name){
                    	let Services = Properties.Private.Services;
                        if (!Services.hasOwnProperty(Name)){return}
                        return Services[Name];
                    },
                    CanGet:true,
                    CanSet:false,
                },
                AddService:{
                	Value:function(Properties,Name,Class){
                    	let Services = Properties.Private.Services;
                        if (Services.hasOwnProperty(Name)){return}
                        if (!(Class instanceof Proxy)){return}
                        Class.Parent = this;
                        Properties.Private.Services[Name] = Class;
                    },
                    CanGet:true,
                    CanSet:false,
                },
            },
            Private:{
                ParentLocked:true,
                Services:{},
                Body:undefined,
                Sounds:undefined,
            },
            Events:{
            	OnStart:undefined,
                WorldLoaded:undefined,
            },
        },
        CreateOnce:true,
        CanCreate:true,
        Extends:["Proxy"],
        ExtraData:{
        	OnCreation:function(Properties){
            	Properties.Private.Body = document.body;
            	if (!Properties.Private.Body){
                	let Body = document.createElement("body");
                    document.appendChild(Body);
                	Properties.Private.Body = Body;
                }
                Properties.Private.Sounds = document.getElementById("Sounds");
                if (!Properties.Private.Sounds){
                	let Sound = document.createElement("div");
                    Sound.setAttributeNode(document.createAttribute("hidden"));
                    let ID = document.createAttribute("id");
                    ID.value = "Sounds";
                    Sound.setAttributeNode(ID);
                    Properties.Private.Body.appendChild(Sound);
                    Properties.Private.Sounds = Sound;
                }
            },
        },
    },
    World:{
    	Properties:{
        	Public:{
            	Renderer:{
                	Value:undefined,
                   	CanGet:true,
                    CanSet:false,
                },
                SetRenderer:{
                	Value:function(Properties,Renderer){
                    	if (Properties.Public.Renderer.Value !== undefined){return}
                        if (!(Renderer instanceof Proxy)){return}
                        Properties.Public.Renderer.Value = Renderer;
                        this.AddChild(Renderer);
                        Properties.Events.RendererLoaded.Private.Fire(Renderer);
                    },
                    CanGet:true,
                    CanSet:false,
                },
                CoinSpawnRate:{
                	Value:10,
                    CanGet:true,CanSet:false,
                },
                GetBlocks:{
                	Value:function(Properties){
                    	return Properties.Private.Blocks;
                    },
                    CanGet:true,
                    CanSet:false,
                },
                GetLights:{
                	Value:function(Properties){
                    	return Properties.Private.Lights;
                    },
                    CanGet:true,
                    CanSet:false,
                },
                SetPlayer:{
                	Value:function(Properties,Player){
                    	if (Properties.Public.Player.Value){return}
                        Properties.Public.Player.Value = Player;
                    },CanGet:true,CanSet:false,
                },
                Player:{
                	Value:undefined,
                    CanGet:true,CanSet:false,
                },
            },
            Private:{
            	Blocks:[],
                Lights:[],
                ParentLocked:false,
                Lock:true,
            },
            Events:{
            	RendererLoaded:undefined,
            },
        },
        CreateOnce:true,
        CanCreate:true,
        Extends:["Proxy"],
        ExtraData:{
        	OnCreation:function(Properties){
        		this.ChildAdded.Connect((Connection,Child)=>{
            		if (Child.IsA("Block")){
                		Properties.Private.Blocks.push(Child);
                	} else if (Child.IsA("Light")){
                    	Properties.Private.Lights.push(Child);
                    }
            	});
            	this.ChildRemoved.Connect((Connection,Child)=>{
            		if (Child.IsA("Block")){
                		Properties.Private.Blocks.splice(Properties.Private.Blocks.indexOf(Child),1);
                	} else if (Child.IsA("Light")){
                    	Properties.Private.Lights.splice(Properties.Private.Lights.indexOf(Child),1);
                    }
            	});
        	},
        },
    },
    Renderer:{
    	Properties:{
        	Public:{
            	MaxFPS:{
                	Value:15,
                    CanGet:true,
                    CanSet:false,
                },
                FPS:{
                	Value:0,
                    CanGet:true,
                    CanSet:false,
                },
                Frames:{
                	Value:0,
                    CanGet:true,
                    CanSet:false,
                },
                Wait:{
                	Value:function(Properties,Time){
                    	return new Promise((resolve,reject)=>{
                        	setTimeout(()=>{
                            	resolve();
                            },Time*1000)
                        })
                    },
                    CanGet:true,
                    CanSet:false, 
                },
                Run:{
                	Value:async function(Properties){
                    	let CurrentTime = Date.now()/1000;
                        let Difference = CurrentTime - Properties.Private.Time;
                        Properties.Private.Time = CurrentTime;
                        Properties.Public.Frames.Value++;
                        Properties.Public.FPS.Value = 1/Difference;
                        Properties.Events.PreRender.Private.Fire(Difference);
                        Properties.Events.Render.Private.Fire(Difference);
                        Properties.Events.PostRender.Private.Fire(Difference);
                        await this.Wait((1/this.MaxFPS))
                        return this.Run();
                    },
                    CanGet:true,
                    CanSet:false,
                },
            },
            Private:{
            	Time:Date.now()/1000,
                Render:function(Properties){
                	
                },
                ParentLocked:false,
                Lock:true,
            },
            Events:{
            	PostRender:undefined,
                Render:undefined,
                PreRender:undefined,
            },
        },
        CreateOnce:true,
        CanCreate:true,
        Extends:["Proxy"],
    },
    VectorHandler:{
    	Properties:{
        	Public:{
            	Add:{
                	Value:function(Properties,v1,v2){
                    	if (typeof v2 == "number"){v2 = new Vector(v2,v2)}
                    	return new Vector(v1.x+v2.x,v1.y+v2.y);
                    },CanGet:true,CanSet:false,
				},
                Subtract:{
                	Value:function(Properties,v1,v2){
                    	if (typeof v2 == "number"){v2 = new Vector(v2,v2)}
                    	return new Vector(v1.x-v2.x,v1.y-v2.y);
                    },CanGet:true,CanSet:false,
				},
                Multiply:{
                	Value:function(Properties,v1,v2){
                    	if (typeof v2 == "number"){v2 = new Vector(v2,v2)}
                    	return new Vector(v1.x*v2.x,v1.y*v2.y);
                    },CanGet:true,CanSet:false,
				},
                Divide:{
                	Value:function(Properties,v1,v2){
                    	if (typeof v2 == "number"){v2 = new Vector(v2,v2)}
                    	return new Vector(v1.x/v2.x,v1.y/v2.y);
                    },CanGet:true,CanSet:false,
				},
                Distance:{
                	Value:function(Properties,v1,v2){
                    	return Math.sqrt(Math.pow(v2.x-v1.x,2)+Math.pow(v2.y-v1.y,2));
                    },CanGet:true,CanSet:false,
				},
            },
            Private:{},
            Events:{},
        },
        CanCreate:false,
        Extends:["Proxy"],
    },
    Block:{
    	Properties:{
        	Public:{
            	Position:{
                	Value:new Vector(0,0),
                    CanGet:true,
                    CanSet:true,
                },
                Shade:{
                	Value:0.5,
                	CanGet:true,
                    CanSet:true,
                },
            },
            Private:{
            	
            },
            Events:{
            	
            },
        },
        CanCreate:true,
        Extends:["Proxy"],
    },
    Input:{
    	Properties:{
        	Public:{
            	MouseTypes:{
                	Value:["Left","Middle","Right"],
                    CanGet:true,
                    CanSet:false,
                },
            },
            Private:{
            	MouseTime:Date.now()/1000,
                MouseInterval:1/60,
                ParentLocked:false,
                Lock:true,
            },
            Events:{
            	OnInput:undefined,
            },
        },
        CreateOnce:true,
        CanCreate:true,
        Extends:["Proxy"],
        ExtraData:{
        	OnCreation:function(Properties){
            	window.addEventListener("keydown",e=>{
                	Properties.Events.OnInput.Private.Fire(new InputBase("Key","Down",e.key));
                });
                window.addEventListener("keyup",e=>{
                	Properties.Events.OnInput.Private.Fire(new InputBase("Key","Up",e.key));
                });
                window.addEventListener("mousedown",e=>{
                	let MouseType = this.MouseTypes[e.button];
                	Properties.Events.OnInput.Private.Fire(new InputBase("Mouse","Down",undefined,e.x,e.y,MouseType));
                });
                window.addEventListener("mouseup",e=>{
                	let MouseType = this.MouseTypes[e.button];
                	Properties.Events.OnInput.Private.Fire(new InputBase("Mouse","Up",undefined,e.x,e.y,MouseType));
                });
                window.addEventListener("mousemove",e=>{
                	let Time = Date.now()/1000
                	if (Time-Properties.Private.MouseTime < Properties.Private.MouseInterval){return}
                    Properties.Private.MouseTime = Time;
                	Properties.Events.OnInput.Private.Fire(new InputBase("Mouse","Move",undefined,e.x,e.y));
                });
            },
		},
    },
    Mouse:{
    	Properties:{
        	Public:{
            	X:{
                	Value:0,
                    CanGet:true,
                    CanSet:false,
                },
                Y:{
                	Value:0,
                    CanGet:true,
                    CanSet:false,
                }
            },
            Private:{
            	
            },
            Events:{
            	OnMove:undefined,
            },
        },
        CreateOnce:true,
        CanCreate:true,
        Extends:["Proxy"],
        ExtraData:{
        	OnCreation:function(Properties){
            	window.addEventListener("mousemove",e=>{
                	Properties.Public.X.Value = e.x;
                    Properties.Public.Y.Value = e.y;
                    Properties.Events.OnMove.Private.Fire(Properties.Public.X.Value,Properties.Public.Y.Value);
                })
            },
        }
    },
    Log:{
    	Properties:{
        	Public:{
            	Print:{
                	Value:function(Properties,Text){
                    	let Element = Properties.Private.CreateElement();
                        Element.innerHTML = "[PRINT]: " + String(Text);
                        Element.style.color = "#000000";
                        Properties.Events.OnLog.Private.Fire("Print",Text)
                    },
                    CanGet:true,
                    CanSet:false,
                },
                Error:{
                	Value:function(Properties,Text){
                    	let Element = Properties.Private.CreateElement();
                        Element.innerHTML = "[ERROR]: " + String(Text);
                        Element.style.color = "#ff0000";
                        Properties.Events.OnLog.Private.Fire("Error",Text)
                    },
                    CanGet:true,
                    CanSet:false,
                },
                Warn:{
                	Value:function(Properties,Text){
                    	let Element = Properties.Private.CreateElement();
                        Element.innerHTML = "[WARN]: " + String(Text);
                        Element.style.color = "#ff9900";
                        Properties.Events.OnLog.Private.Fire("Warn",Text)
                    },
                    CanGet:true,
                    CanSet:false,
                },
            },
            Private:{
            	ParentLocked:false,
                Lock:true,
                CreateElement:function(){
                	let Element = document.createElement("p");
                    document.body.appendChild(Element);
                    return Element;
                }
            },
            Events:{
            	OnLog:undefined,
            },
        },
        CreateOnce:true,
        CanCreate:true,
        Extends:["Proxy"],
    },
    Player:{
    	Properties:{
        	Public:{
            	GetMouse:{
                	Value:function(Properties){
                    	return Properties.Private.Mouse;
                    },
                    CanGet:true,
                    CanSet:false,
                },
                MovementSpeed:{
                	Value:2,
                    CanGet:true,
                    CanSet:false,
                },
                Position:{
                	Value:new Vector(0,0),
                    CanGet:true,CanSet:true,
                },
                Coins:{
                	Value:0,
                    CanGet:true,CanSet:false,
                },
                GiveCoins:{
                	Value:function(Properties,Coins){
                    	Properties.Public.Coins.Value += Coins;
                    },CanGet:true,CanSet:false,
                },
                Shade:{
                	Value:0.5,
                    CanGet:true,
                    CanSet:true,
                },
            },
            Private:{
            	Mouse:undefined,
            },
            Events:{
            	
            },
        },
        CreateOnce:true,
        CanCreate:true,
        Extends:["Proxy"],
        ExtraData:{
        	OnCreation:function(Properties){
            	Properties.Private.Mouse = new Proxy("Mouse");
            },
        },
    },
    Sound:{
    	Properties:{
        	Public:{
            	Play:{
                	Value:function(Properties){
                    	if (Properties.Private.Sound !== undefined){
                        	Properties.Private.Sound.play();
                            Properties.Events.OnPlay.Private.Fire();
                        }
                    },
                    CanGet:true,
                    CanSet:false,
                },
                Stop:{
                	Value:function(Properties){
                    	if (Properties.Private.Sound !== undefined){
                        	Properties.Private.Sound.pause();
                            Properties.Private.Sound.currentTime = 0;
                            Properties.Events.OnStop.Private.Fire();
                        }
                    },
                    CanGet:true,
                    CanSet:false,
                },
                Pause:{
                	Value:function(Properties){
                    	if (Properties.Private.Sound !== undefined){
                        	Properties.Private.Sound.pause();
                            Properties.Events.OnPause.Private.Fire();
                        }
                    },
                    CanGet:true,
                    CanSet:false,
                },
                Source:{
                	Value:"",
                    CanGet:true,
                    CanSet:true,
                    OnSet:function(Properties,Value){
                    	if (!Properties.Private.Sound){return false}
                    	if (Value == Properties.Private.Sound.src){return false}
                        Properties.Public.IsLoaded.Value = false
                        Properties.Private.Sound.src = Value;
                        return true;
                    }
                },
                Looped:{
                	Value:false,
                    CanGet:true,
                    CanSet:true,
                    OnSet:function(Properties,Value){
                    	if (!Properties.Private.Sound){return false}
                    	Properties.Private.Sound.setAttribute("loop",Value);
                        return true;
                    }
                },
                Length:{
                	Value:0,
                    CanGet:true,
                    CanSet:false,
                    OnGet:function(Properties){
                    	return Properties.Private.Sound.duration;
                    },
                },
                IsLoaded:{
                	Value:false,
                    CanGet:true,
                    CanSet:false,
                },
                Time:{
                	Value:0,
                    CanGet:true,
                    CanSet:false,
                    OnGet:function(Properties){
                    	return Properties.Private.Sound.currentTime;
                    }
                },
            },
            Private:{
            	Sound:undefined,
            },
            Events:{
            	Loaded:undefined,
                OnPlay:undefined,
                OnStop:undefined,
                OnPause:undefined,
                Ended:undefined,
            },
		},
        CanCreate:true,
        Extends:["Proxy"],
        ExtraData:{
        	OnCreation:function(Properties){
            	let Sounds = document.getElementById("Sounds");
            	let Sound = document.createElement("audio");
                Sound.setAttribute("preload","auto");
                Sound.setAttribute("controls","none");
                Sound.setAttribute("loop",false);
                Sound.setAttributeNode(document.createAttribute("hidden"));
                Sounds.appendChild(Sound);
                Sound.addEventListener("loadeddata",()=>{
                	Properties.Public.IsLoaded.Value = true;
                	Properties.Events.Loaded.Private.Fire();
                });
                Sound.addEventListener("ended",()=>{
                	Properties.Events.Ended.Private.Fire();
                });
                Properties.Private.Sound = Sound;
            },
        },
    },
    Screen:{
    	Properties:{
        	Public:{
            	SetColor:{
                	Value:function(Properties,Color){
                    	Properties.Private.Screen.SetColor(Color);
                    },
                    CanGet:true,
                    CanSet:false,
                },
                Draw:{
                	Value:function(Properties,X,Y){
                    	Properties.Private.Screen.Draw(X,Y);
                    },
                    CanGet:true,
                    CanSet:false,
                },
                DrawBG:{
                	Value:function(Properties){
                    	Properties.Private.Screen.Background();
                    },
                    CanGet:true,
                    CanSet:false,
                },
                DrawShade:{
                	Value:function(Properties,x,y,a,b,c){
                    	Properties.Private.Screen.DrawShade(x,y,a,b,c);
                    },
                    CanGet:true,
                    CanSet:false,
                },
                Clear:{
                	Value:function(Properties){
                    	Properties.Private.Screen.Clear();
                    },
                    CanGet:true,
                    CanSet:false,
                },
                NewSpriteMap:{
                	Value:function(Properties,Name,Data){
                		if (Properties.Private.SpriteMaps.hasOwnProperty(Name)){return}
                        Properties.Private.SpriteMaps[Name] = Data;
                    },
                    CanGet:true,
                    CanSet:false,
                },
                GetSpriteMap:{
                	Value:function(Properties,Name){
                    	return Properties.Private.SpriteMaps[Name];
                    },
                    CanGet:true,
                    CanSet:false,
                },
                GetScreenPosition:{
                	Value:function(Properties,Block){
                    	return new Vector((Block.Position.x) + this.ScreenPosition.x,(Block.Position.y) + this.ScreenPosition.y);
                    },
                    CanGet:true,
                    CanSet:false,
                },
                PointOnScreen:{
                	Value:function(Properties,Point,Width,Height){
                    	let x= Point.x,y=Point.y;
                        let ax = this.ScreenSize.x,ay=this.ScreenSize.y;
                        if ((x > -1 && x < ax) && (y > -1 && y < ay)){
                        	return true;
                        }
                        return false;
                    },
                    CanGet:true,
                    CanSet:false,
                },
                GetCorners:{
                	Value:function(Properties,Position,Width,Height){
                        let x=Position.x,y=Position.y;
                        let ps = Reference.GetPixelSize();
                        ps = new Vector(ps.x/1.6,ps.y/1.6);
                        let TL = new Vector((x),(y));
                        let TR = new Vector((x),(y+(Height/ps.y)));
                        let BL = new Vector((x+(Width/ps.x)),(y));
                        let BR = new Vector((x+(Width/ps.x)),(y+(Height/ps.y)));
                        //Reference.Draw(TL.x,TL.y);
                        //Reference.Draw(BR.x,BR.y);
                        /*
                    	let TL = new Vector((Position.x*(Width))+(0/(Width/2)),(Position.y*(Height))+(0/(Height/2)));
                        let TR = new Vector(((Position.x+0.5)*(Width))+((Width-1)/(Width/2)),(Position.y*(Height))+(0/(Height/2)));
                        let BL = new Vector((Position.x*(Width))+(0/(Width/2)),((Position.y+0.5)*(Height))+((Height-1)/(Height/2)));
                        let BR = new Vector(((Position.x+0.5)*(Width))+((Width-1)/(Width/2)),((Position.y+0.5)*(Height))+((Height-1)/(Height/2)));
                        */
                        return [TL,TR,BL,BR];
                    },CanGet:true,CanSet:false,
                },
                PointOverlaps:{
                	Value:function(Properties,p1,p2,p3){
                    	let x = p1.x, y = p1.y;
                        let ax = p2.x, ay = p2.y;
                        let bx = p3.x, by = p3.y;
                       	if ((x >= ax && x <= bx) && (y >= ay && y <= by)){
                        	return true;
                        }
                        return false;
                    },CanGet:true,CanSet:false,
                },
                IsTouching:{
                	Value:function(Properties,p1,p2,w1,h1,w2,h2){
                    	let [tla,tra,bla,bra] = this.GetCorners(p1,w1,h1);
                        let [tlb,trb,blb,brb] = this.GetCorners(p2,w2,h2);
                        if (this.PointOverlaps(tla,tlb,brb)){return true}
                        if (this.PointOverlaps(tra,tlb,brb)){return true}
                        if (this.PointOverlaps(bla,tlb,brb)){return true}
                        if (this.PointOverlaps(bra,tlb,brb)){return true}
                        return false;
                    },CanGet:true,CanSet:false,
                },
                IsOnScreen:{
                	Value:function(Properties,Block,Width,Height){
                    	let Position = this.GetScreenPosition(Block);
                        let [TL,TR,BL,BR] = this.GetCorners(Position,Width,Height);
                        if (this.PointOnScreen(TL,Width,Height)){return true}
                        if (this.PointOnScreen(TR,Width,Height)){return true}
                        if (this.PointOnScreen(BL,Width,Height)){return true}
                        if (this.PointOnScreen(BR,Width,Height)){return true}
                        return false
                    },
                    CanGet:true,
                    CanSet:false,
                },
                ScreenPosition:{
                	Value:new Vector(0,0),
                    CanGet:true,
                    CanSet:true,
                },
                ScreenSize:{
                	Value:Reference.BaseSize,
                    CanGet:true,
                    CanSet:false,
                },
            },
            Private:{
            	Screen:undefined,
                SpriteMaps:{},
            },
            Events:{
            	
            },
        },
        CreateOnce:true,
        CanCreate:true,
        Extends:["Proxy","VectorHandler"],
        ExtraData:{
        	OnCreation:function(Properties){
            	Properties.Private.Screen = Reference;
                Reference.Setup();
            },
        },
    },
    Table:{
    	Properties:{
        	Public:{
            	Get:{
                	Value:function(Properties,KeyName){
                    	let Inner = Properties.Private.Inner;
                        if (!Inner.hasOwnProperty(KeyName)){return}
                       	return Inner[KeyName];
                    },
                    CanGet:true,
                    CanSet:false,
                },
                Set:{
                	Value:function(Properties,KeyName,Value){
                    	let Inner = Properties.Private.Inner;
                        Inner[KeyName] = Value;
                    },
                    CanGet:true,
                    CanSet:false,
                },
                Has:{
                	Value:function(Properties,KeyName){
                    	return Properties.Private.Inner.hasOwnProperty(KeyName);
                    },
                    CanGet:true,
                    CanSet:false,
                },
                All:{
                	Value:function(Properties){
                    	return Properties.Private.Inner;
					},CanGet:true,CanSet:false,
                },
            },
            Private:{
            	Inner:{},
            },
            Events:{
            	
            },
        },
        CanCreate:true,
        Extends:["Proxy"],
    },
    Coin:{
    	Properties:{
        	Public:{
            	GetValue:{
                	Value:function(Properties){
                    	return Properties.Private.Types[this.Type];
                    },CanGet:true,CanSet:false,
                },
            	Collect:{
                	Value:function(Properties){
                    	if (Properties.Private.Collected){return}
                    	let World = this.Parent;
                        if (!World){return}
                        if (!World.IsA("World")){return}
                        if (!World.Player){return}
                        if (!World.Player.IsA("Player")){return}
                        World.Player.GiveCoins(this.GetValue());
                        Properties.Events.OnCollect.Private.Fire();
                      	Properties.Private.Collected = true;
                    },CanGet:true,CanSet:false,
                },
                Type:{
                	Value:"Normal",
                    CanGet:true,
                    CanSet:false,
                },
                SetType:{
                	Value:function(Properties,Name){
                    	if (Properties.Private.TypeSet){return}
                        if (!Properties.Private.Types.hasOwnProperty(Name)){return}
                        Properties.Public.Type.Value = Name;
                    },CanGet:true,CanSet:false,
                },
            },
            Private:{
            	TypeSet:false,
            	Types:{
                	"Normal":1,
                    "Red":2,
                    "Gold":3,
                },
                Collected:false,
            },
            Events:{
            	OnCollect:undefined,
            },
        },
        CanCreate:true,
        Extends:["Proxy","Block"],
    },
    Light:{
    	Properties:{
        	Public:{
            	Range:{
                	Value:2,
                    CanGet:true,CanSet:true,
                },
                Brightness:{
                	Value:1,
                    CanGet:true,CanSet:true,
                },
                Color:{
                	Value:new Color(0,0,0,0),
                    CanGet:true,
                    CanSet:true,
                },
                EmittingFrom:{
                	Value:null,
                    CanGet:true,CanSet:true,
                    OnSet:function(Properties,New){
                    	if (!(New instanceof Proxy)){return false}
                        if (!New.IsA("Block")){return false}
                        return true;
                    }
                },
            },
            Private:{
            
            },
            Events:{},
        },
        CanCreate:true,
        Extends:["Proxy"],
    },
});

// -- {{ ~==~ }} -- Connection Classes -- {{ ~==~ }} -- \\

class ConnectionBaseClass {
	#Name = "Connection";
    constructor(Name){
    	this.#Name = "Connection_"+Name;
    };
    toString(){
    	return this.#Name;
    };
};

class ConnectionPublic extends ConnectionBaseClass {
	#Parent = undefined;
    #Connections = [];
	constructor(Parent,Name,Connections){
    	super(Name);
        this.#Connections = Connections;
        this.#Parent = Parent;
    };
    Disconnect(){
    	this.#Parent.Remove(this,this.#Connections);
    };
    toValue(){
    	return this;
    };
};

class ConnectionBase extends ConnectionBaseClass {
	#Public = undefined;
    #Callback = undefined;
    #Parent = undefined;
   	#Remove = undefined;
    constructor(Parent,Name,Callback,Remove,Connections){
    	super(Name);
        this.#Parent = Parent;
        this.#Public = new ConnectionPublic(this,Name,Connections);
        this.#Callback = Callback.bind(this.#Public);
        this.#Remove = Remove;
    };
    get Remove(){
    	return this.#Remove;
    }
    get Callback(){
    	return this.#Callback;
    }
    get Parent(){
    	return this.#Parent;
    };
    get Public(){
    	return this.#Public;
	}
};

// -- {{ ~==~ }} -- Event Classes -- {{ ~==~ }} -- \\

class EventBaseClass {
	#Name = "Event";
    constructor(Name){
    	this.#Name = Name;
    }
    toString(){
    	return this.#Name
    }
};

class EventPublic extends EventBaseClass {
	#Parent = undefined;
    #Name = undefined;
    #Remove = undefined;
   	constructor(Parent,Name){
    	super(Name);
        this.#Name = Name;
        this.#Parent = Parent;
        this.#Remove = this.#Parent.RemoveConnection;
    };
    Connect(Callback){
    	let Connection = new ConnectionBase(this,this.#Name,Callback,this.#Remove,this.#Parent.Connections);
    	this.#Parent.AddConnection(Connection);
        return Connection.Public;
    };
    async Wait(){
    	let Results = await new Promise((resolve,reject)=>{
        	this.#Parent.Waiting.push(resolve);
        }).then((Args)=>{
            return Args;
        })
        return Results;
    };
};

class EventPrivate extends EventBaseClass {
	#Parent = undefined;
   	constructor(Parent,Name){
    	super(Name);
        this.#Parent = Parent;
    }
    Fire(...Args){
    	let Waiting = Array.of(...this.#Parent.Waiting);
        let a = Array.of(...Args)
        for (let Value of Waiting){
        	Value(a);
            this.#Parent.Waiting.pop();
        };
    	let Connections = this.#Parent.Connections;
        for (let Connection of Connections){
        	Connection.Callback(Connection.Public,...Args);
        }
    };
    get Connections(){
    	return this.#Parent.Connections;
    }
};

class EventBase extends EventBaseClass {
	#Private = undefined;
    #Public = undefined;
    #Connections = [];
    #Waiting = [];
	constructor(Name){
    	super(Name);
        this.#Connections = [];
        this.#Waiting = [];
        this.#Public = new EventPublic(this,Name);
        this.#Private = new EventPrivate(this,Name);
    };
    AddConnection(Callback){
    	if (this.#Connections.includes(Callback)){return};
        this.#Connections.push(Callback);
    };
    RemoveConnection(Callback,Connections){
    	for (let Key in Connections){
        	let Value = Connections[Key];
            if (Value.Public == Callback){
            	Connections.splice(Key,1);
                return;
            }
        }
    };
    get Waiting(){
    	return this.#Waiting;
    }
    get Public(){
    	return this.#Public;
    };
    get Private(){
    	return this.#Private;
    };
    get Connections(){
    	return this.#Connections;
    }
};

// -- {{ ~==~ }} -- ClassReference -- {{ ~==~ }} -- \\

const ClassReference = Object.freeze({
	Exists:function(Class){
    	return Classes.hasOwnProperty(Class);
	},
    Get:function(Class){
    	let Public = {};
        let Private = {};
        let Events = {};
        let ExtraData = {};
        let Append = function(To,From){
        	for (let Key in From){
            	if (!To.hasOwnProperty(Key)){
                	let Value = From[Key]
            		To[Key] = Value;
                }
            }
        }
        for (let Key in Classes){
        	let Value = Classes[Key];
            if (Key == Class){
            	Append(Private,Value.Properties.Private);
                Append(Public,Value.Properties.Public);
                Append(Events,Value.Properties.Events);
                Append(ExtraData,Value.ExtraData);
                for (let Extend of Value.Extends){
                	let Parent = Classes[Extend];
                    Append(Private,Parent.Properties.Private);
                    Append(Public,Parent.Properties.Public);
                    Append(Events,Parent.Properties.Events);
                    Append(ExtraData,Value.ExtraData);
                }
            }
        }
        return {Public:Public,Private:Private,Events:Events,ExtraData:ExtraData};
    },
    DeepCopy:function(Value){
    	let NewValue = {};
        if (Value instanceof Array){
        	NewValue = [];
        }
        for (let Key in Value){
        	let V = Value[Key];
            if (typeof(V) == "object"){
            	if (typeof(V) != "function"){
                	V = this.DeepCopy(V);
                }
            }
            if (typeof(V) == "function"){
            	var that = V;
    			var temp = function temporary() { return that.apply(V, arguments); };
    			for(var key in V) {
        			if (V.hasOwnProperty(key)) {
            			temp[key] = V[key];
        			}
    			}
            }
            NewValue[Key] = V;
        }
        return NewValue;
    },
    GetTypes:function(Class){
    	let Types = [];
        for (let Key in Classes){
        	if (Class == Key){
            	let Value = Classes[Key];
                Types.push(Class);
                Types.push.apply(Types,Value.Extends)
            }
        }
        return Types;
    },
});

// -- {{ ~==~ }} -- Proxy -- {{ ~==~ }} -- \\

class Proxy {
	#Properties = {};
    #Cache = {};
    #AddProperty = function(Name,CanGet,CanSet){
    	let Properties = this.#Properties;
        let Cache = this.#Cache;
        let Holder = Properties.Public
        let Prop = Holder[Name];
        if (Prop.hasOwnProperty("OnGet")){
            Prop.OnGet = Prop.OnGet.bind(this)  
        }
        if (Prop.hasOwnProperty("OnSet")){
        	Prop.OnSet = Prop.OnSet.bind(this);
        }
        let Self = this;
        if (!Holder.hasOwnProperty(Name)){return}
        Object.defineProperty(Self,Name,{
        	get:function(){
            	if (!CanGet){return undefined}
                let Property = Holder[Name];
                if (Property.hasOwnProperty("OnGet")){
                	return Property.OnGet(Properties);
                }
                let PropertyValue = Property.Value
                if (typeof(PropertyValue) == "function"){
                	if (Cache.hasOwnProperty(Name)){return Cache[Name]};
                    PropertyValue = PropertyValue.bind(Self);
                	let Callback = function(...Args){
                		return PropertyValue(Properties,...Args);
                	}
                    Callback = Callback.bind(Self)
                	Cache[Name] = Callback
                    return Callback;
                }
                return PropertyValue
            },
            set:function(NewValue){
            	if (!CanSet){return}
                let Property = Holder[Name];
                if (Property.hasOwnProperty("OnSet")){
                	if (!Property.OnSet(Properties,NewValue)){return}
                }
                let PreValue = Property.Value
                Property.Value = NewValue
                if (PreValue != NewValue){
                	Properties.Events.Changed.Private.Fire(Name);
                }
            }
        });
    };
    #SetProperty = function(Name,Value,Type){
    	this.#Properties[Type][Name].Value = Value
	}
	constructor(Type){
    	if (!ClassReference.Exists(Type)){throw Error(`Proxy with ClassName of ${Type} does not exist!`)}
        if (!Classes[Type].CanCreate){throw Error(`Cannot create Proxy with ClassName of ${Type}`)}
        let Properties = ClassReference.DeepCopy(ClassReference.Get(Type));
        this.#Properties = Properties;
        let ClassType = Classes[Type];
        if (ClassType.hasOwnProperty("CreateOnce")){
        	if (ClassType.CreateOnce == true){
            	ClassType.CanCreate = false;
            }
        }
        for (let Key in Properties.Public){
        	let Value = Properties.Public[Key];
            if (typeof(Value.Value) == "function"){
            	Properties.Public[Key].Value = Value.Value.bind(this);
            }
            this.#AddProperty(Key,Value.CanGet,Value.CanSet);
        }
        for (let Key in Properties.Events){
        	let Value = new EventBase(Key);
            Object.defineProperty(this,Key,{
            	get:function(){
                	return Value.Public;
                },
                set:function(){
                	return;
                },
            })
            this.#Properties.Events[Key] = Value;
        }
        this.#SetProperty("Name",Type,"Public");
        this.#SetProperty("ClassName",Type,"Public");
        for (let Key in Properties.Private){
        	let Value = Properties.Private[Key];
            if (typeof(Value) == "function"){
            	Properties.Private[Key] = Value.bind(this);
            }
        }
        for (let Key in Properties.ExtraData){
        	let Value = Properties.ExtraData[Key];
            if (typeof(Value) == "function"){
            	Properties.ExtraData[Key] = Value.bind(this);
            }
        }
        if (Properties.ExtraData.hasOwnProperty("OnCreation")){
        	Properties.ExtraData.OnCreation(Properties);
        }
        Object.preventExtensions(this);
    }
    toString(){
    	return this.Name;
    }
};

// {{ Main Game }} \\

const Random = function(mi,ma){return Math.floor(Math.random() * (ma-mi+1) + mi)}

const Game = new Proxy("Game");
Game.OnStart.Connect((Connection)=>{
	Connection.Disconnect();
    Game.AddService("Log",new Proxy("Log"));
	const Log = Game.GetService("Log");
    Game.WorldLoaded.Connect((Connection,World)=>{
    	Connection.Disconnect();
        // {{ Player }} \\
        const Player = new Proxy("Player");
        World.SetPlayer(Player);
        // {{ Key Map }} \\
        const KeyMap = new Proxy("Table");
        const VectorMap = new Proxy("Table");
      	["w","a","s","d"].forEach((x,y)=>{
        	KeyMap.Set(x,false);
            VectorMap.Set(x,[
            	new Vector(0,1),
                new Vector(1,0),
                new Vector(0,-1),
                new Vector(-1,0),
            ][y]);
        });
        // {{ Renderer }} \\
        World.RendererLoaded.Connect((Connection,Renderer)=>{
        	Connection.Disconnect();
            // {{ Screen }} \\
            const Screen = new Proxy("Screen");
            const BGColor = new Color(0,0,0);
            // {{ Block Sprite Map }} \\
            Screen.NewSpriteMap("Block",[
				[new Color(161,101,32),new Color(207,154,93),new Color(161,101,32),new Color(207,154,93)],
                [new Color(207,132,41),new Color(207,132,41),new Color(207,154,93),new Color(161,101,32)],
                [new Color(161,101,32),new Color(207,154,93),new Color(207,132,41),new Color(207,154,93)],
                [new Color(207,132,41),new Color(207,132,41),new Color(161,101,32),new Color(161,101,32)],
            ]);
            // {{ Player Sprite Map }} \\
            Screen.NewSpriteMap("Player",[
            	[new Color(0,0,0,0),new Color(71,154,255),new Color(71,154,255),new Color(0,0,0,0)],
                [new Color(0,0,0,0),new Color(0,0,0,0),new Color(0,0,0,0),new Color(0,0,0,0)],
                [new Color(71,154,255),new Color(71,154,255),new Color(71,154,255),new Color(71,154,255)],
                [new Color(71,154,255),new Color(0,0,0,0),new Color(0,0,0,0),new Color(71,154,255)],
            ]);
            // {{ Coin Sprite Maps }} \\
            Screen.NewSpriteMap("CoinNormal",[
            	[new Color(100,255,100),new Color(150,255,150)],
                [new Color(0,200,0),new Color(0,255,0)],
            ]);
            Screen.NewSpriteMap("CoinRed",[
            	[new Color(255,100,100),new Color(255,150,150)],
                [new Color(255,0,0),new Color(200,0,0)],
            ]);
            Screen.NewSpriteMap("CoinGold",[
            	[new Color(255,180,65),new Color(255,200,100)],
                [new Color(200,130,10),new Color(255,160,45)],
            ]);
            // {{ Map Walls }} \\
            for (i=0;i<=100;i++){
            	let Block = new Proxy("Block");
                Block.Parent = World;
                Block.Position = new Vector(i,0);
            }
            for (i=1;i<=14;i++){
            	let Block = new Proxy("Block");
                Block.Parent = World;
                Block.Position = new Vector(0,i);
            }
            for (i=1;i<=12;i++){
            	let Block = new Proxy("Block");
                Block.Parent = World;
                Block.Position = new Vector(15,i);
            }
            for (i=0;i<=15;i++){
            	let Block = new Proxy("Block");
                Block.Parent = World;
                Block.Position = new Vector(i,15);
            }
            // {{ Block Map }} \\ Basically every wall that's inside the walls
            let BlockMap = [
            	[0,0,0,0,0,0,0,0,0,0,0,0,0,0], //1
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0], //2
                [0,0,1,1,1,0,0,1,1,1,1,0,0,0], //3
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0], //4
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0], //5
                [0,0,0,1,1,1,0,0,0,0,0,0,0,0], //6
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0], //7
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0], //8
                [0,0,0,0,0,1,0,0,1,0,0,1,0,0], //9
                [0,0,0,0,0,1,0,0,1,0,0,1,0,0], //10
                [0,0,1,1,1,1,0,0,0,0,0,1,0,0], //11
                [0,0,1,0,0,0,0,0,0,0,0,1,0,0], //12
                [0,0,0,0,0,0,0,0,1,0,0,0,0,0], //13
                [0,0,0,0,0,0,0,0,1,0,0,0,0,0], //14
            ];
            for (let k in BlockMap){
            	k=+k;
            	let v = BlockMap[k];
                for (let kk in v){
                	kk=+kk;
                	let vv = v[kk];
                    if (vv == 1){
                    	let Block = new Proxy("Block");
                        Block.Parent = World;
                        Block.Position = new Vector(kk+1,k+1);
                    }
                }
            }
            // {{ Render Connections }} \\
            Renderer.PreRender.Connect((Connection,Delta)=>{
            	Screen.Clear();
                // {{ Key Handler }} \\
                let All = KeyMap.All();
                let FPS = Renderer.MaxFPS;
                let Blocks = World.GetBlocks();
                let Map = Screen.GetSpriteMap("Block");
                let Width = Map[0].length;
                let Height = Map.length;
                let PlayerMap = Screen.GetSpriteMap("Player");
                let PWidth = PlayerMap[0].length;
                let PHeight = PlayerMap.length;
                for (let KeyName in All){
                	let Value = All[KeyName];
                    if (Value === true){
                    	let LSP = Screen.ScreenPosition;
                        Screen.ScreenPosition = Screen.Add(Screen.ScreenPosition,Screen.Divide(VectorMap.Get(KeyName),2*Player.MovementSpeed));
                        let SP = Screen.ScreenPosition;
                		let LPP = Player.Position;
                		Player.Position = new Vector(-SP.x+(15/2),-SP.y+(15/2));
                		let CPP = Screen.GetScreenPosition(Player);
                		for (let Block of Blocks){
                			if (!Screen.IsOnScreen(Block,Width,Height)||Block.ClassName=="Coin"){continue}
                            if (Screen.IsTouching(CPP,Screen.GetScreenPosition(Block),PWidth,PHeight,Width,Height)){
                    			Screen.ScreenPosition = LSP;
                        		Player.Position = LPP;
                        		break;
                    		}
                		}
					}
                    let SP = Screen.ScreenPosition;
                    Player.Position = new Vector(-SP.x+(15/2),-SP.y+(15/2));
                    CPP = Screen.GetScreenPosition(Player);
                    for (let Block of Blocks){
                        if (Block.ClassName == "Coin"){
                            let CMap = Screen.GetSpriteMap("Coin"+Block.Type);
                            let CW=CMap[0].length,CH=CMap.length;
                            if (Screen.IsTouching(Screen.GetScreenPosition(Block),CPP,CW,CH,PWidth,PHeight)){
                                Block.Collect();
                            }
                        }
                   	}
                }
            });
            Renderer.Render.Connect((_,d)=>{
            	try{
            	Screen.SetColor(BGColor);
                Screen.DrawBG();
            	// {{ Block Renderer }} \\
            	let Blocks = World.GetBlocks();
                let Map = Screen.GetSpriteMap("Block");
                let Width = Map[0].length;
                let Height = Map.length;
                for (let Block of Blocks){
                	let CMap = Map,CW = Width,CH=Height;
                	if (Block.ClassName == "Coin"){
                    	CMap = Screen.GetSpriteMap("Coin"+Block.Type);
                        CW = CMap[0].length;
                        CH = CMap.length;
                    }
                	if (Screen.IsOnScreen(Block,Width,Height)){
                    	let Position = Screen.GetScreenPosition(Block,CW,CH);
                		for (let k in CMap){
                        	k=+k;
                    		let v = CMap[k];
                        	for (let kk in v){
                            	kk=+kk;
                        		let vv = v[kk];
                            	Screen.SetColor(vv);
                                let a = (Position.x*(4))+(kk);
                                let b = (Position.y*(4))+(k);
                            	Screen.Draw(a,b);
                        	}
                    	}
                        Screen.DrawShade(Position.x*4,Position.y*4,CW,CH,Block.Shade)
                    }
                }
                // {{ Player Renderer }} \\
                let PlayerMap = Screen.GetSpriteMap("Player");
                let PWidth = PlayerMap[0].length;
                let PHeight = PlayerMap.length;
                let PPos = Screen.GetScreenPosition(Player);
                for (let k in PlayerMap){
                	let v = PlayerMap[k];
                    for (let kk in v){
                    	let vv = v[kk];
                        Screen.SetColor(vv);
                        let a = (PPos.x*(PWidth))+(kk/1);
                        let b = (PPos.y*(PHeight))+(k/1);
                        Screen.Draw(a,b);
                    }
                }
                Screen.DrawShade(PPos.x*PWidth,PPos.y*PHeight,PWidth,PHeight,Player.Shade);
                // {{ Light Renderer }} \\
                let Lights = World.GetLights();
                for (let Block of Blocks){
                	if (!Screen.IsOnScreen(Block)){continue}
                    let PShade = Block.Shade;
                    let Lit = false;
                	for (let Light of Lights){
                		if (!Light.EmittingFrom){continue}
                    	let Emit = Light.EmittingFrom;
                    	let EP = new Vector(Emit.Position.x-0.25,Emit.Position.y-0.25);
                        let P = Block.Position;
                        let Dist = Screen.Distance(EP,P);
                        if (Dist > Light.Range){
                            continue;
                        }
                        let NewShade = 1-Math.max((1/Dist)*Light.Brightness,0.5);
                        Lit = true;
                        Block.Shade = NewShade;
                        PShade = Block.Shade;
                	}
                    if (!Lit){
                    	Block.Shade = 0.5;
                    }
                }
                // {{ Light Player Renderer }} \\
                let PShade = Player.Shade;
                let PLit = false;
                for (let Light of Lights){
                	if (!Light.EmittingFrom){continue}
                    let Emit = Light.EmittingFrom;
                    let EP = new Vector(Emit.Position.x-0.25,Emit.Position.y-0.25);
                    let P = Player.Position;
                    let Dist = Screen.Distance(EP,P);
                    if (Dist > Light.Range){
                    	continue;
                   	}
                    let NewShade = 1-Math.max((1/Dist)*Light.Brightness,0.5);
                    PLit = true;
                    Player.Shade = NewShade;
                    PShade = Player.Shade;
              	}
                if (!PLit){
                	Player.Shade = 0.5;
                }
                }catch(e){
                	Log.Warn(e);
                    throw Error(e);
                }
           	});
            let LastSpawned = Date.now()/1000;
            Renderer.PostRender.Connect(()=>{
            	let Current = Date.now()/1000;
                if (Current-LastSpawned>World.CoinSpawnRate){
                	LastSpawned = Current;
                    let Coin = new Proxy("Coin");
                    Coin.Parent = World;
                    let Light = new Proxy("Light");
                    Light.Parent = World;
                    Light.Range = 3;
                    Light.EmittingFrom = Coin;
                    let RN = Random(0,10);
                    if (RN < 6){
                    	Coin.SetType("Normal");
                    } else if (RN < 9){
                    	Coin.SetType("Red");
                    } else {
                    	Coin.SetType("Gold");
                    }
                    Coin.Position = new Vector(Random(1,14),Random(1,14));
                    let Blocks = World.GetBlocks();
                    for (let Block of Blocks){
                        if (Block.ClassName != "Coin"){
                            let CMap = Screen.GetSpriteMap("Block");
                            let CW=CMap[0].length,CH=CMap.length;
                            if (Screen.IsTouching(Screen.GetScreenPosition(Coin),Screen.GetScreenPosition(Block),1,1,CW,CH)){
                                Coin.Remove();
                                Light.Remove();
                                return;
                            }
                        }
                   	}
                    Coin.OnCollect.Connect((Connection)=>{
                    	Connection.Disconnect();
                        Coin.Remove();
                        Light.Remove();
                    });
                }
			});
           	Renderer.Run();
        });
        World.SetRenderer(new Proxy("Renderer"));
        // {{ Input Handler }} \\
        const Input = new Proxy("Input");
        let Arrows = {"arrowdown":"s","arrowup":"w","arrowright":"d","arrowleft":"a"}
        Input.OnInput.Connect((Connection,InputObject)=>{
        	if (InputObject.Type == "Key"){
            	let KeyName = InputObject.KeyName.toLowerCase();
                if (Arrows.hasOwnProperty(KeyName)){
                	KeyName = Arrows[KeyName];
                }
            	if (KeyMap.Has(KeyName)){
                	KeyMap.Set(KeyName,InputObject.Action == "Down" ? true : false);
                }
            }
        });
    });
    Game.SetWorld(new Proxy("World"));
});
Game.Start();
//Hi, if you're reading I'm attempting to fix this "error" that cut off my code
