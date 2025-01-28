  import React, { useRef, useEffect, useState } from "react";
  import cannon from "./assets/cannon.png"
  import tyre from "./assets/tyre.png"
  import bg from "./assets/bg.jpg";
  import hand from "./assets/hand.png";
  import { motion } from "framer-motion";
  import { TbMusic } from "react-icons/tb";
  import { TbMusicOff } from "react-icons/tb";
  const App = () => {
    const canvasRef = useRef(); //  for reference
    
    const [spawn, setspawn] = useState(false) // for events handling
    const [showMessage, setShowMessage] = useState(true); // events handling 
    const [message, setMessage] = useState("Swipe to Start"); // to rpint on div
    const [gameOverState, setgameOverState] = useState(false); // Track if game is over
    const [score, setscore] = useState(0) // track score
    const [highScore, sethighScore] = useState(0)
    const [isMusicOff, setIsMusicOff] = useState(true);

    
    let tireRotation = 0 // to rotate tires
    let balls = []; // create balls for shoot
    let fallingBalls = []; // create balls to random spawn
    let newFallingBalls = [];//array to push split balls
    let fireParticles = []; // Fire effect array


    let isGameOver = false; // track game over state
    const restartGame = () => {
      isGameOver = false; // Reset game over state when restarting
      if(score>highScore){
        sethighScore(score);
        localStorage.setItem("highScore", score);
      }
      setgameOverState(false); // Update state to hide UI
      // empty all arrays after restart
      balls = [];
      fallingBalls = [];
      fireParticles = [];
      setscore(0)
      setspawn(false);

      animate(); // Restart animation
    };
   
    const shootingSound = new Audio(`${import.meta.env.BASE_URL || ''}/shooting1.mp3`);
    const gameOverSound = new Audio(`${import.meta.env.BASE_URL || ''}/gameover.mp3`);
    
      useEffect(() => {
        // Retrieve high score from localStorage
        const savedHighScore = localStorage.getItem("highScore");
        if (savedHighScore) {
          sethighScore(Number(savedHighScore)); // Set the high score state if it exists in localStorage
        }
      }, []);
    

      useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Set canvas dimensions
      canvas.width = window.innerWidth - 50;
      canvas.height = window.innerHeight - 50;


      let ballSpeed = 15; //manage ball speed
      let lastShotTime = 0; // Track the last shot time
      const shotCooldown = 200; // for cooldown in shooting to control shooting speed

      let cannonX = canvas.width / 2; // Initialize x-coordinate for the cannon

      // Load images of cannon and tire
      const cannonImage = new Image();
      const tireImage = new Image();

      cannonImage.src = cannon; // cannon image URL
      tireImage.src = tyre; // tire image URL

      let animationFrameId = null; // to manmage frames

      // game over function
      const gameOver = () => {
        if (isGameOver) return; // Prevent multiple calls
        if (!isMusicOff) {
          // Play the sound when music is not off
          gameOverSound.play();
        }
        isGameOver = true; // Set the game over true 
        setgameOverState(true); // Update state to show UI

        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId); // cancel animation
          animationFrameId = null; // Reset animationFrameId
        }
      };




      // Fire Particle Class
      class FireParticle {
        constructor(x, y, isDark = false) {
          //initalizng values
          this.x = x + Math.random() * 10 - 5;
          this.y = y + Math.random() * 10 - 5;
          this.size = Math.random() * 10 + 3;
          this.opacity = 1;
          this.speedY = Math.random() * -2;

          //to change colour with shooting smoke and collison smoke
          const grayShade = isDark
            ? Math.floor(Math.random() * 50 + 200) // Default bright gray 
            : Math.floor(Math.random() * 30 + 150); // Darker gray 
          this.color = `rgba(${grayShade}, ${grayShade}, ${grayShade}, ${this.opacity})`;
        }

        //updaing fire particles for animation
        update() {
          this.y += this.speedY;
          this.opacity -= 0.05;
        }

        //drawing particles
        draw() {
          ctx.fillStyle = this.color;
          ctx.globalAlpha = this.opacity;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }


      // Function to draw the canvas
      const drawCannon = (x) => {
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Cannon dimensions
        const baseWidth = 120;
        const baseHeight = 10;

        // Tire dimensions
        const tireRadius = 30;
        const tireSize = tireRadius * 2;

        const squareWidth = baseWidth - 40; // Distance between tires 
        const squareHeight = 10; // Height of the line


        // Restrict the cannon's x-coordinate within canvas boundaries so it not go outside with mouse
        const constrainedX = Math.max(baseWidth / 2, Math.min(canvasWidth - baseWidth / 2, x));

        // Base position
        const baseX = constrainedX - baseWidth / 2; // Centered 
        const baseY = canvasHeight - baseHeight - 50; // Slightly above the bottom edge for ground effect




        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw fire particles on canvas
        fireParticles.forEach((particle, index) => {
          particle.update();
          particle.draw();
          if (particle.opacity <= 0) {
            fireParticles.splice(index, 1);
          }
        });



        //drawn balls that will spawn
        fallingBalls.forEach((ball) => {
          //value inserting
          ctx.strokeStyle = "white";
          ctx.fillStyle = "#9B59B6";
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fill();
          //to draw mass inside balls
          ctx.fillStyle = "white";
          ctx.font = "30px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(Math.round(ball.mass), ball.x, ball.y);
          ctx.closePath();
        });


        //shoot balls draw
        balls.forEach((ball) => {
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
          ctx.fillStyle = "black";
          ctx.fill();
          ctx.closePath();
        });
        // Adjust cannon position and rotation
        ctx.save();
        ctx.translate(constrainedX, baseY - 70);
        ctx.rotate(0.1);
        // Draw the cannon image
        ctx.drawImage(
          cannonImage,
          (-baseWidth / 2) + 10,
          -70,
          baseWidth,
          140
        );
        ctx.restore();


        //drawing line to connect tires

        const squareX = baseX + 8 + tireRadius; // X-coordinate for the start of the line between the tires
        const squareY = baseY + baseHeight - tireRadius - 6; // arrange line Just below the tires

        ctx.fillStyle = "rgba(176, 53, 0, 0.75)";
        ctx.fillRect(squareX, squareY, squareWidth, squareHeight); // Draw the line connecting the tires

        // Draw the tires 
        // Left tire
        ctx.save();
        ctx.translate(baseX + 10 + tireRadius, baseY + baseHeight - tireRadius);
        ctx.rotate(tireRotation);
        ctx.drawImage(
          tireImage,
          -tireRadius,
          -tireRadius,
          tireSize,
          tireSize
        );
        ctx.restore();

        // Right tire
        ctx.save();
        ctx.translate(baseX + baseWidth - 40 + tireRadius, baseY + baseHeight - tireRadius);
        ctx.rotate(tireRotation)
        ctx.drawImage(
          tireImage,
          -tireRadius,
          -tireRadius,
          tireSize,
          tireSize
        );
        ctx.restore();


      };
      // Wait for images to load 
      const handleImageLoad = () => {
        drawCannon(cannonX); // draw when images load
      };

      cannonImage.onload = handleImageLoad;
      tireImage.onload = handleImageLoad;

      //update function to animate things
      const updateBalls = () => {
        balls = balls.filter((ball) => ball.y > 0); // Remove balls that are out of the canvas
        //updating balls which are inside array
        balls.forEach((ball) => {
          ball.x += ball.vx;
          ball.y += ball.vy;
        });

        // Update falling balls
        const ground = canvas.height - 50;  // for bounce back on that ground effect in image
        const cannonBaseY = canvas.height - 50; // cannon position
        const cannonXStart = cannonX - 60; // left boundary
        const cannonXEnd = cannonX + 60; // right boundary

        //updating balls which are inside array
        fallingBalls.forEach((ball) => {
          ball.y += ball.vy; // Move the ball downward

         
          if (ball.y + ball.radius >= cannonBaseY && ball.x >= cannonXStart && ball.x <= cannonXEnd) {
            gameOver(); // Call the game over function after collison with cannon
          }

          //change direction after boundary collisons of falling balls
          if (ball.y + ball.radius > ground || ball.y - ball.radius < 60) {
            ball.vy = -ball.vy; // Reverse and reduce velocity 
          } else {
            ball.vy += ball.gravity; //add speed as gravity effect
          }
          //change direction after width collison 
          if (ball.x + ball.radius + 10 > canvas.width || ball.x - ball.radius < 0) {
            ball.vx = -ball.vx;
            ball.x += ball.vx;
          }
          // Increase x only when the ball is moving upward
          if (ball.vy < 0 && ball.y - ball.radius > ball.bounceLimit && ball.x + ball.radius + 2 <= canvas.width) {
            ball.x += ball.vx;
          }

        });


        // Detect collisions between shot balls and falling balls
        fallingBalls = fallingBalls.filter((fallingBall) => {
          //function to check colliding
          const isColliding = balls.some((shotBall) => {
            const dx = shotBall.x - fallingBall.x;
            const dy = shotBall.y - fallingBall.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            // Increment score on every collision
            if (distance < fallingBall.radius + 10) {
              setscore(prevScore => prevScore + 1);
              return true;
            }
            return distance < fallingBall.radius + 10; // Collision check
          });
          //cases after collison
          if (isColliding) {
            // Reduce mass upon collision
            fallingBall.mass -= 3;

            //setting new values for split balls
            const newMass = Math.round(fallingBall.oldmass) / 2;
            const newRadius = fallingBall.radius - 15;

            // Split into two smaller balls if mass is too low
            if (fallingBall.mass < 20) {
              //creating split balls if mass is more than 10
              if (newMass > 13) {
                const leftBall = {
                  ...fallingBall,
                  x: fallingBall.x - newRadius,
                  radius: newRadius,
                  mass: newMass,
                  oldmass: newMass,
                  vx: -Math.abs(fallingBall.vx),
                };

                const rightBall = {
                  ...fallingBall,
                  x: fallingBall.x + newRadius,
                  radius: newRadius,
                  mass: newMass,
                  oldmass: newMass,
                  vx: Math.abs(fallingBall.vx),
                };
                //timeout to remove glitches of load
                setTimeout(() => {
                  fallingBalls.push(leftBall, rightBall);
                }, 100);
              }
              return false; // Remove the original ball
            }
          }

          //animation of smoke after collison between falling and shoot balls
          let collidedBalls = [];
          balls = balls.filter((shotBall) => {
            const dx = shotBall.x - fallingBall.x;
            const dy = shotBall.y - fallingBall.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < fallingBall.radius + 10) {
              collidedBalls.push(shotBall);
              return false;
            }
            return true;
          });
          collidedBalls.forEach((shotBall) => {
            for (let i = 0; i < 15; i++) {
              fireParticles.push(new FireParticle(shotBall.x, shotBall.y, false));
            }
          });
          return fallingBall.y < canvas.height; // Remove if colliding or out of bounds
        });
      };
      //to add split balls
      fallingBalls = newFallingBalls;

      
      // Function to shoot a ball
      const shootBall = (x) => {
        const currentTime = Date.now(); // Get the current time
        if (currentTime - lastShotTime < shotCooldown) return; // Skip if within cooldown period

        lastShotTime = currentTime; // Update the last shot time with current time

        const angle = Math.atan2(-140, x - cannonX); // Angle of the cannon 
        const vx = ballSpeed * Math.cos(angle); // Horizontal velocity
        const vy = ballSpeed * Math.sin(angle); // Vertical velocity
        balls.push({ x: cannonX, y: canvas.height - 150, vx, vy }); // Add new ball

        // Generate Fire Particles for shoot animation
        for (let i = 0; i < 35; i++) {
          fireParticles.push(new FireParticle(cannonX, canvas.height - 210, 100));
        }

      };
      //to push balls in array of fallingballs
      const addFallingBall = () => {
        if (!spawn) return;
        const radius = 45; 
        const mass = Math.random() * (50 - 30) + 30;
        const x = radius + Math.random() * (canvas.width - 2 * radius);
        const y = Math.random() * (270 - 200) + 200; 
        let vy = 7;
        let vx =  Math.random() < 0.5 ? -5 : 5;;
        let gravity = Math.random() * (0.6 - 0.5) + 0.5;
        let bounceLimit = 10;
        const oldmass = mass;
        fallingBalls.push({ x, y, radius, vy, gravity, vx, bounceLimit, mass, oldmass }); // Add new falling ball
      };

      //  Animate function to run everything
      const animate = () => {
        if (isGameOver) return; // Stop function if the game is over
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
        updateBalls();  // call updateBalls
        drawCannon(cannonX); // Redraw the cannon and balls according to mouse
        animationFrameId = requestAnimationFrame(animate); // animating
      };


      // Mouse move event listener
      const handleMouseMove = (event) => {

        if (showMessage) {
          setShowMessage(false);  // Hide the ui of start once mouse moves
          
        }
      //  if(!isMusicOff){
      //    shootingSound.play(); // Play sound on mouse movement
      //  }
        cannonX = event.clientX; // Update the x-coordinate with the mouse position
        tireRotation += 0.1;  // rotate tyre with mouse movement by incrementing
        shootBall(cannonX)

        
        setspawn(true);

      
       
      };

      animate();


     
      setTimeout(addFallingBall, 1000);
      setInterval(addFallingBall, 5000); // spawn balls at intervals
      

      // Add event listener to the canvas
      canvas.addEventListener("mousemove", handleMouseMove);
    
      if (isGameOver) {
        cancelAnimationFrame(animationFrameId)
      }
      // Cleanup the event listener
      return () => {
        canvas.removeEventListener("mousemove", handleMouseMove);

      };
    }, [spawn]);
    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const handleMouseMove = (event) => {
      if (!isMusicOff) {
        // Play the sound when music is not off
        shootingSound.play();
      } else {
        shootingSound.pause(); // Pause the sound when music is off
        shootingSound.currentTime = 0; // Reset sound to the beginning to prevent it from resuming from where it was paused
      }}
      canvas.addEventListener('mousemove',handleMouseMove)
      return () => {
        canvas.removeEventListener('mousemove', handleMouseMove);
      };
    }, [isMusicOff]); // Dependency array ensures effect runs when isMusicOff changes
  


    return (
      <div className="relative">
        <div className="absolute mx-8 ml-12 mt-6 w-[86%] flex items-center justify-between cursor-pointer">
         <div
      className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-black text-3xl cursor-pointer"
      onClick={() => setIsMusicOff(isMusicOff ? false : true)}
    >
      {isMusicOff ? <TbMusicOff /> : <TbMusic />}
    </div>
          <div>High score: {highScore}</div>
        </div>
      {gameOverState && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center cursor-pointer"
          onClick={restartGame}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <h1 className="text-white text-4xl font-bold">Game Over</h1>
          <p className="text-white">Touch to continue</p>
        </div>
      )}
      <canvas 
        ref={canvasRef} 
        className="border border-red-700 bg-cover bg-center bg-no-repeat" 
        style={{ backgroundImage: `url(${bg})` }}
      ></canvas>
      {!showMessage ? (
        <div className="absolute top-[19%] left-[47%] text-black text-6xl font-bold text-shadow-md">
          <h1>{score}</h1>
          
        </div>
      ) : (

        <div><div className="absolute top-[31%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-3xl font-bold text-center p-5 rounded-md">
          {message}
          <div className="w-96 h-10 bg-black bg-opacity-50 -mb-2 rounded-full relative" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}></div>
          <motion.img
            src={hand}
            alt="Hand"
            className="absolute w-12 top-full transform -translate-y-1/2"
            initial={{ x: -120 }}
            animate={{ x: [0, 300, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
    </div>
         </div>
        
        
      )}
    </div>
    
    );
  };

  export default App;
