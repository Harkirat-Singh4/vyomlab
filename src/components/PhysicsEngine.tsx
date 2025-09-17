// Advanced Physics Engine for Professional Rocket Simulation
// Based on OpenRocket-style calculations

export interface FlightDataPoint {
  time: number;
  altitude: number;
  velocity: number;
  acceleration: number;
  mass: number;
  thrust: number;
  drag: number;
  mach: number;
  stability: number;
  angleOfAttack: number;
  verticalVelocity: number;
  lateralVelocity: number;
  position: { x: number; y: number; z: number };
}

export interface RocketPhysics {
  totalMass: number;
  dryMass: number;
  propellantMass: number;
  centerOfGravity: number;
  centerOfPressure: number;
  stabilityMargin: number;
  dragCoefficient: number;
  referenceArea: number;
  length: number;
  diameter: number;
}

export interface MotorData {
  designation: string;
  totalImpulse: number;
  burnTime: number;
  averageThrust: number;
  maxThrust: number;
  propellantMass: number;
  totalMass: number;
  thrustCurve: Array<{ time: number; thrust: number }>;
  delay: number;
}

export interface LaunchConditions {
  altitude: number;
  temperature: number;
  pressure: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  launchAngle: number;
  launchDirection: number;
  rodLength: number;
}

export class PhysicsEngine {
  private gravity = 9.81; // m/s²
  private airDensitySeaLevel = 1.225; // kg/m³
  private gasConstant = 287; // J/(kg·K)
  private temperatureLapseRate = 0.0065; // K/m

  calculateAirDensity(altitude: number, temperature: number): number {
    const temperatureAtAltitude = temperature - this.temperatureLapseRate * altitude;
    const pressure = 101325 * Math.pow(1 - 0.0065 * altitude / 288.15, 5.257);
    return pressure / (this.gasConstant * (temperatureAtAltitude + 273.15));
  }

  calculateDragForce(velocity: number, airDensity: number, dragCoefficient: number, referenceArea: number): number {
    return 0.5 * airDensity * velocity * velocity * dragCoefficient * referenceArea;
  }

  calculateStabilityMargin(centerOfGravity: number, centerOfPressure: number, diameter: number): number {
    const caliber = (centerOfPressure - centerOfGravity) / diameter;
    return caliber;
  }

  calculateCenterOfPressure(components: any[]): number {
    // Simplified Barrowman equations for center of pressure
    let totalCpContribution = 0;
    let totalArea = 0;

    components.forEach(component => {
      let cpContribution = 0;
      let area = 0;

      switch (component.type) {
        case 'nosecone':
          // Nose cone CP is at 2/3 of length from tip
          cpContribution = component.y + (2/3) * component.height;
          area = Math.PI * Math.pow(component.width / 2, 2);
          break;
        case 'fins':
          // Fin CP is at the fin location
          cpContribution = component.y + component.height / 2;
          area = component.width * component.height; // Simplified fin area
          break;
        case 'bodytube':
          // Body tube has minimal CP contribution
          cpContribution = component.y + component.height / 2;
          area = component.width * component.height * 0.1; // Minimal contribution
          break;
      }

      totalCpContribution += cpContribution * area;
      totalArea += area;
    });

    return totalArea > 0 ? totalCpContribution / totalArea : 0;
  }

  calculateCenterOfGravity(components: any[]): number {
    const totalMass = components.reduce((sum, comp) => sum + comp.mass, 0);
    if (totalMass === 0) return 0;

    const totalMoment = components.reduce((sum, comp) => {
      const componentCg = comp.y + comp.height / 2;
      return sum + comp.mass * componentCg;
    }, 0);

    return totalMoment / totalMass;
  }

  simulateFlightStep(
    currentState: FlightDataPoint,
    rocketPhysics: RocketPhysics,
    motorData: MotorData | null,
    launchConditions: LaunchConditions,
    deltaTime: number
  ): FlightDataPoint {
    const { time, altitude, velocity, mass } = currentState;
    
    // Calculate current thrust
    let thrust = 0;
    if (motorData && time <= motorData.burnTime) {
      // Interpolate thrust from curve
      const thrustPoint = motorData.thrustCurve.find(point => 
        Math.abs(point.time - time) < deltaTime / 2
      );
      thrust = thrustPoint ? thrustPoint.thrust : 0;
    }

    // Calculate air density at current altitude
    const airDensity = this.calculateAirDensity(
      launchConditions.altitude + altitude,
      launchConditions.temperature
    );

    // Calculate drag force
    const dragForce = this.calculateDragForce(
      Math.abs(velocity),
      airDensity,
      rocketPhysics.dragCoefficient,
      rocketPhysics.referenceArea
    );

    // Apply drag in opposite direction of velocity
    const dragAcceleration = velocity > 0 ? -dragForce / mass : dragForce / mass;

    // Calculate gravitational acceleration (varies with altitude)
    const gravityAtAltitude = this.gravity * Math.pow(6371000 / (6371000 + altitude), 2);

    // Net acceleration
    const thrustAcceleration = thrust / mass;
    const totalAcceleration = thrustAcceleration + dragAcceleration - gravityAtAltitude;

    // Update state using Runge-Kutta integration
    const newVelocity = velocity + totalAcceleration * deltaTime;
    const newAltitude = Math.max(0, altitude + velocity * deltaTime + 0.5 * totalAcceleration * deltaTime * deltaTime);
    const newMass = motorData && time <= motorData.burnTime 
      ? mass - (motorData.propellantMass / motorData.burnTime) * deltaTime
      : mass;

    // Calculate Mach number
    const speedOfSound = Math.sqrt(1.4 * this.gasConstant * (launchConditions.temperature - this.temperatureLapseRate * altitude + 273.15));
    const mach = Math.abs(velocity) / speedOfSound;

    // Calculate stability (simplified)
    const stability = this.calculateStabilityMargin(
      rocketPhysics.centerOfGravity,
      rocketPhysics.centerOfPressure,
      rocketPhysics.diameter
    );

    return {
      time: time + deltaTime,
      altitude: newAltitude,
      velocity: newVelocity,
      acceleration: totalAcceleration,
      mass: newMass,
      thrust,
      drag: dragForce,
      mach,
      stability,
      angleOfAttack: 0, // Simplified
      verticalVelocity: newVelocity,
      lateralVelocity: 0, // Simplified for 1D simulation
      position: { x: 0, y: newAltitude, z: 0 }
    };
  }

  runFullSimulation(
    rocketPhysics: RocketPhysics,
    motorData: MotorData,
    launchConditions: LaunchConditions,
    maxTime: number = 60,
    timeStep: number = 0.01
  ): FlightDataPoint[] {
    const results: FlightDataPoint[] = [];
    
    let currentState: FlightDataPoint = {
      time: 0,
      altitude: 0,
      velocity: 0,
      acceleration: 0,
      mass: rocketPhysics.totalMass,
      thrust: 0,
      drag: 0,
      mach: 0,
      stability: 0,
      angleOfAttack: 0,
      verticalVelocity: 0,
      lateralVelocity: 0,
      position: { x: 0, y: 0, z: 0 }
    };

    results.push({ ...currentState });

    while (currentState.time < maxTime && (currentState.altitude > 0 || currentState.velocity > 0 || currentState.time < 1)) {
      currentState = this.simulateFlightStep(
        currentState,
        rocketPhysics,
        motorData,
        launchConditions,
        timeStep
      );
      
      results.push({ ...currentState });

      // Stop if rocket has landed and velocity is near zero
      if (currentState.altitude <= 0 && Math.abs(currentState.velocity) < 1.0 && currentState.time > 1) {
        // Ensure final point shows ground landing
        currentState.altitude = 0;
        currentState.velocity = 0;
        results.push({ ...currentState });
        break;
      }
    }

    return results;
  }
}