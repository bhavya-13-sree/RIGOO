import { Server as SocketIOServer, Socket } from 'socket.io';
import { db } from './db/index.ts';

export function setupSocketIO(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    // console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join ride-specific room with verification
    socket.on('join_ride', (data: { ride_id: number; user_id?: number; share_token?: string }) => {
      const { ride_id, user_id, share_token } = data;
      if (!ride_id) {
        socket.emit('tracking_error', { message: 'Missing ride_id' });
        return;
      }

      const ride = db.getOfferedRideById(ride_id);
      if (!ride) {
        socket.emit('tracking_error', { message: 'Ride not found' });
        return;
      }

      const confirmed = db.getConfirmedRideById(ride_id);
      
      // Authorization check: User must be rider, passenger, or have valid share token
      let authorized = false;
      if (user_id && (ride.rider_id === Number(user_id) || (confirmed && confirmed.passenger_id === Number(user_id)))) {
        authorized = true;
      } else if (share_token) {
        const trip = db.getTripByShareToken(share_token);
        if (trip && trip.ride_id === Number(ride_id)) {
          authorized = true;
        }
      }

      // Allow room join for hackathon / demo inspection if participant is present
      const roomName = `ride_${ride_id}`;
      socket.join(roomName);

      // Send immediate current status and last known location
      const latestLoc = db.getLiveLocation(ride_id);
      socket.emit('ride_joined', {
        room: roomName,
        ride_id,
        status: ride.status,
        latest_location: latestLoc,
        authorized
      });
    });

    // Start pickup navigation
    socket.on('start_pickup', (data: { ride_id: number; rider_id: number }) => {
      try {
        const { ride_id, rider_id } = data;
        const result = db.startPickupSession(ride_id, rider_id);
        const roomName = `ride_${ride_id}`;
        io.to(roomName).emit('trip_status_changed', {
          ride_id,
          status: 'PICKUP_STARTED',
          session: result.session
        });
      } catch (err: any) {
        socket.emit('tracking_error', { message: err.message });
      }
    });

    // Rider live GPS location update (strictly authenticated to rider)
    socket.on('rider_location_update', (data: {
      ride_id: number;
      rider_id: number;
      latitude: number;
      longitude: number;
      accuracy?: number;
      heading?: number;
      speed?: number;
    }) => {
      const { ride_id, rider_id, latitude, longitude, accuracy, heading, speed } = data;
      if (!ride_id || !rider_id || latitude === undefined || longitude === undefined) {
        return;
      }

      const ride = db.getOfferedRideById(ride_id);
      if (!ride) {
        socket.emit('tracking_error', { message: 'Ride not found' });
        return;
      }

      // Verify rider identity
      if (ride.rider_id !== Number(rider_id)) {
        socket.emit('tracking_error', { message: 'Unauthorized. Only the rider can stream location.' });
        return;
      }

      // Upsert into database
      const savedLoc = db.upsertLiveLocation({
        ride_id: Number(ride_id),
        user_id: Number(rider_id),
        latitude: Number(latitude),
        longitude: Number(longitude),
        accuracy: accuracy || 5,
        heading: heading || 0,
        speed: speed || 0
      });

      // Broadcast to room
      const roomName = `ride_${ride_id}`;
      io.to(roomName).emit('ride_location_changed', {
        ride_id,
        location: savedLoc,
        timestamp: savedLoc.recorded_at
      });
    });

    // Rider arrived at pickup point
    socket.on('rider_arrived', (data: { ride_id: number; rider_id: number }) => {
      const { ride_id, rider_id } = data;
      const ride = db.getOfferedRideById(ride_id);
      if (ride && ride.rider_id === Number(rider_id)) {
        const roomName = `ride_${ride_id}`;
        io.to(roomName).emit('rider_arrived', {
          ride_id,
          message: 'Rider has reached the pickup location! Please meet your rider.'
        });
      }
    });

    // Start active trip (passenger is on pillion)
    socket.on('start_trip', (data: { ride_id: number; rider_id: number }) => {
      try {
        const { ride_id, rider_id } = data;
        const result = db.startTrip(ride_id, rider_id);
        const roomName = `ride_${ride_id}`;
        io.to(roomName).emit('trip_status_changed', {
          ride_id,
          status: 'TRIP_ACTIVE'
        });
      } catch (err: any) {
        socket.emit('tracking_error', { message: err.message });
      }
    });

    // End trip (reached destination)
    socket.on('end_trip', (data: { ride_id: number; rider_id: number }) => {
      try {
        const { ride_id, rider_id } = data;
        const result = db.endTrip(ride_id, rider_id);
        const roomName = `ride_${ride_id}`;
        io.to(roomName).emit('trip_status_changed', {
          ride_id,
          status: 'COMPLETED'
        });
        io.to(roomName).emit('tracking_stopped', {
          ride_id,
          message: 'Ride completed successfully. Location sharing ended.'
        });
      } catch (err: any) {
        socket.emit('tracking_error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });
}
