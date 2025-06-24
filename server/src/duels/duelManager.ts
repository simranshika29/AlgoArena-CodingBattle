import { Socket, Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import Problem, { IProblem } from '../models/Problem'; // Import Problem model
import { executeCode } from '../services/codeExecutor'; // Import codeExecutor
import User from '../models/User'; // Add this import

interface DuelRoom {
  id: string;
  players: {
    userId: string;
    socketId: string;
    username: string;
    isReady: boolean;
    submission?: {
      code: string;
      language: 'javascript' | 'python' | 'c' | 'cpp';
      testResults?: any[]; // Store results
      passedAll?: boolean; // Did they pass all tests?
      submissionTime?: number; // Time of submission
    };
  }[];
  problem: IProblem | null;
  status: 'waiting' | 'starting' | 'in-progress' | 'completed';
  startTime: number | null;
  winnerId: string | null; // Track winner
}

class DuelManager {
  private rooms: Map<string, DuelRoom>;
  private io: Server;

  constructor(io: Server) {
    this.rooms = new Map();
    this.io = io;
  }

  createDuel(player1: { userId: string; username: string }, socket: Socket): DuelRoom {
    const roomId = uuidv4();
    const newRoom: DuelRoom = {
      id: roomId,
      players: [{ userId: player1.userId, socketId: socket.id, username: player1.username, isReady: false }],
      problem: null,
      status: 'waiting',
      startTime: null,
      winnerId: null,
    };
    this.rooms.set(roomId, newRoom);
    console.log(`Duel room created: ${roomId} by ${player1.username}`);
    return newRoom;
  }

  async joinDuel(roomId: string, player2: { userId: string; username: string }, socket: Socket): Promise<DuelRoom | null> {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length >= 2 || room.status !== 'waiting') {
      console.log(`Failed to join room ${roomId}: ${!room ? 'not found' : room.players.length >= 2 ? 'full' : 'not waiting'}`);
      return null;
    }

    room.players.push({ userId: player2.userId, socketId: socket.id, username: player2.username, isReady: false });
    room.status = 'starting';
    this.rooms.set(roomId, room);
    console.log(`${player2.username} joined room ${roomId}`);

    // Assign problem and start countdown/duel
    await this.assignProblem(roomId);
    // TODO: Implement countdown and transition to 'in-progress'

    return room;
  }

  private async assignProblem(roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;

    try {
      // Fetch both users' duelSolvedProblems
      const userIds = room.players.map(p => p.userId);
      const users = await User.find({ _id: { $in: userIds } });
      const solvedProblemIds = users.flatMap(u => u.duelSolvedProblems.map(id => id.toString()));

      // Fetch a random approved problem NOT in either user's duelSolvedProblems
      const problems = await Problem.aggregate([
        { $match: { status: 'approved', _id: { $nin: solvedProblemIds.map(id => new require('mongoose').Types.ObjectId(id)) } } },
        { $sample: { size: 1 } }
      ]);
      const problem = problems[0];

      if (problem) {
        room.problem = problem;
        room.status = 'in-progress'; // Immediately start after problem assignment for now
        room.startTime = Date.now();
        this.rooms.set(roomId, room);
        // TODO: Emit problem details to the room
        console.log(`Problem assigned to room ${roomId}`);
      } else {
        console.log(`No approved problems found to assign to room ${roomId}`);
        // TODO: Handle case with no approved problems (e.g., end duel)
      }
    } catch (error) {
      console.error(`Error assigning problem to room ${roomId}:`, error);
      // TODO: Handle error (e.g., end duel)
    }
  }

  async handleSubmission(
    roomId: string,
    userId: string,
    code: string,
    language: 'javascript' | 'python' | 'c' | 'cpp',
    socket: Socket, // Pass socket to emit events back to user/room
    io: Server // Pass io to emit to the room
  ): Promise<void> {
    const room = this.rooms.get(roomId);
    const player = room?.players.find(p => p.userId === userId);

    if (!room || !player || room.status !== 'in-progress' || player.submission?.passedAll) {
      console.log(`Submission failed: Room not found, player not in room, duel not in progress, or player already won`);
      socket.emit('submissionResult', { success: false, message: 'Cannot submit at this time' });
      return;
    }

    // Store submission details
    player.submission = { code, language, testResults: [], passedAll: false, submissionTime: Date.now() };
    this.rooms.set(roomId, room);
    io.to(roomId).emit('duelUpdate', room); // Broadcast submission received

    try {
      // Execute code
      // Note: executeCode service expects ITestCase[], need to adapt problem.testCases
      const testCasesForExecution = room.problem?.testCases.map(tc => ({ input: tc.input, output: tc.output, isHidden: tc.isHidden })) || [];
      const results = await executeCode(code, language, testCasesForExecution);

      const passedAll = results.every(result => result.passed);
      const submissionTime = Date.now();

      // Update player submission results and time
      if (player.submission) {
        player.submission.testResults = results;
        player.submission.passedAll = passedAll;
        player.submission.submissionTime = submissionTime;
      }

      io.to(roomId).emit('duelUpdate', room); // Broadcast results

      if (passedAll) {
        // Player passed all test cases!
        // Check if both players have passed all test cases
        const allPassedPlayers = room.players.filter(p => p.submission && p.submission.passedAll && typeof p.submission.submissionTime === 'number');
        if (allPassedPlayers.length === 2) {
          // Both players passed, determine winner by least time
          const [p1, p2] = allPassedPlayers;
          const t1 = p1.submission!.submissionTime! - (room.startTime || 0);
          const t2 = p2.submission!.submissionTime! - (room.startTime || 0);
          let winnerId = p1.userId;
          if (t2 < t1) winnerId = p2.userId;
          room.winnerId = winnerId;
          room.status = 'completed';
          this.rooms.set(roomId, room);
          io.to(room.id).emit('duelEnded', {
            winnerId,
            room,
            times: {
              [p1.userId]: t1,
              [p2.userId]: t2
            }
          });
          console.log(`Duel room ${roomId} completed. Winner: ${winnerId} (times: ${t1}ms, ${t2}ms)`);

          // Add problem to both users' duelSolvedProblems
          const userIds = room.players.map(p => p.userId);
          await User.updateMany(
            { _id: { $in: userIds } },
            { $addToSet: { duelSolvedProblems: room.problem?._id } }
          );
        } else {
          // Wait for the other player to pass all test cases
          socket.emit('submissionResult', { success: true, message: 'You passed all tests! Waiting for your opponent...', results });
        }
      } else {
        // Player failed some tests
        socket.emit('submissionResult', { success: false, message: 'Some tests failed.', results });
      }

    } catch (error) {
      console.error(`Error during code execution for user ${userId} in room ${roomId}:`, error);
      socket.emit('submissionResult', { success: false, message: 'Code execution failed.', error: (error as Error).message });
      // Optionally, set player status to indicate error
    } finally {
      this.rooms.set(roomId, room);
    }
  }

  removePlayerFromDuel(socketId: string): void {
    // Find the room the player is in
    let roomIdToRemove: string | null = null;
    let roomToRemove: DuelRoom | null = null;

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.players.some(player => player.socketId === socketId)) {
        roomIdToRemove = roomId;
        roomToRemove = room;
        break;
      }
    }

    if (roomIdToRemove && roomToRemove) {
      roomToRemove.players = roomToRemove.players.filter(player => player.socketId !== socketId);
      console.log(`Player with socket ID ${socketId} left room ${roomIdToRemove}. Remaining players: ${roomToRemove.players.length}`);

      // If a player leaves a 2-player duel, end the duel
      if (roomToRemove.players.length === 1 && roomToRemove.status === 'in-progress') {
        const remainingPlayer = roomToRemove.players[0];
        roomToRemove.status = 'completed';
        roomToRemove.winnerId = remainingPlayer.userId; // Remaining player wins
        this.rooms.set(roomIdToRemove, roomToRemove);
        // TODO: Emit duelEnded event to the remaining player
        console.log(`Duel room ${roomIdToRemove} ended due to player leaving. Winner: ${remainingPlayer.username}`);
      } else if (roomToRemove.players.length === 0) {
        // If the last player leaves, remove the room
        this.rooms.delete(roomIdToRemove);
        console.log(`Duel room ${roomIdToRemove} removed as all players left.`);
      } else {
         // Update room state for remaining players if more than one
         this.rooms.set(roomIdToRemove, roomToRemove);
         // TODO: Emit duelUpdate to remaining players
      }
    }
  }

  // Add methods for getting room list, getting specific room details etc.
  getRoomList(): DuelRoom[] {
    return Array.from(this.rooms.values()).filter(room => room.status === 'waiting');
  }

  handlePlayerReady(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'waiting') return;

    const player = room.players.find(p => p.userId === userId);
    if (player) {
      player.isReady = true;
      this.rooms.set(roomId, room);
      this.io.to(roomId).emit('duelUpdate', room);

      // Check if both players are ready
      if (room.players.length === 2 && room.players.every(p => p.isReady)) {
        this.startDuel(room);
      }
    }
  }

  private findRoomBySocketId(socketId: string): DuelRoom | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.some((player: { socketId: string }) => player.socketId === socketId)) {
        return room;
      }
    }
    return undefined;
  }

  private handleDisconnect(socket: Socket) {
    console.log('Player disconnected:', socket.id);
    const room = this.findRoomBySocketId(socket.id);
    if (room) {
      const player = room.players.find((p: { socketId: string }) => p.socketId === socket.id);
      if (player) {
        if (room.status === 'waiting') {
          // Remove player from room if duel hasn't started
          room.players = room.players.filter((p: { socketId: string }) => p.socketId !== socket.id);
          if (room.players.length === 0) {
            // If room is empty, remove it
            this.rooms.delete(room.id);
          } else {
            // Notify remaining player
            const remainingPlayer = room.players[0];
            const remainingSocket = this.io.sockets.sockets.get(remainingPlayer.socketId);
            if (remainingSocket) {
              remainingSocket.emit('duelUpdate', room);
            }
          }
        } else if (room.status === 'in-progress') {
          // Mark disconnected player as loser
          const remainingPlayer = room.players.find((p: { socketId: string }) => p.socketId !== socket.id);
          if (remainingPlayer) {
            room.winnerId = remainingPlayer.userId;
            room.status = 'completed';
            // Notify remaining player
            const remainingSocket = this.io.sockets.sockets.get(remainingPlayer.socketId);
            if (remainingSocket) {
              remainingSocket.emit('duelEnded', { winnerId: remainingPlayer.userId, room });
            }
          }
        }
      }
    }
  }

  private async startDuel(room: DuelRoom) {
    try {
      // Get a random approved problem
      const problem = await Problem.findOne({ status: 'approved' }).exec();
      if (!problem) {
        // No approved problems available
        this.io.to(room.id).emit('duelError', { message: 'No approved problems available. Please try again later.' });
        return;
      }

      room.problem = problem;
      room.status = 'starting';
      room.startTime = Date.now();
      this.io.to(room.id).emit('duelUpdate', room);

      // Start countdown
      setTimeout(() => {
        if (room.status === 'starting') {
          room.status = 'in-progress';
          this.io.to(room.id).emit('duelUpdate', room);
        }
      }, 5000); // 5-second countdown
    } catch (error) {
      console.error('Error starting duel:', error);
      this.io.to(room.id).emit('duelError', { message: 'Error starting duel. Please try again.' });
    }
  }
}

export { DuelManager }; 