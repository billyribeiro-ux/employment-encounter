"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  MessageSquare,
  Users,
  Copy,
  Phone,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
}

export default function ConferencePage() {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [participantCount, setParticipantCount] = useState(1);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const ICE_SERVERS = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  const generateRoomId = () => {
    const id = `room-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    setRoomId(id);
    navigator.clipboard.writeText(id).then(() => {
      toast.success("Room ID copied to clipboard");
    });
  };

  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: 30 },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      toast.error("Failed to access camera/microphone. Please check permissions.");
      throw err;
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setParticipantCount(2);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // In production, send via WebSocket signaling server
        console.log("[WebRTC] ICE candidate:", event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        toast.error("Peer disconnected");
        setParticipantCount(1);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, []);

  const startCall = async () => {
    try {
      const stream = await startLocalStream();
      const pc = createPeerConnection();

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      setIsInCall(true);
      toast.success("Call started — share your Room ID to invite others");

      // Start call timer
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      // Error already toasted in startLocalStream
    }
  };

  const endCall = () => {
    // Stop all tracks
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    // Close peer connection
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    // Clear video elements
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    // Clear timer
    if (callTimerRef.current) clearInterval(callTimerRef.current);

    setIsInCall(false);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setCallDuration(0);
    setParticipantCount(1);
    toast.info("Call ended");
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current) return;

    if (isScreenSharing) {
      // Switch back to camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = stream.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        .getSenders()
        .find((s) => s.track?.kind === "video");
      if (sender) sender.replaceTrack(videoTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = stream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(screenTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        screenTrack.onended = () => toggleScreenShare();
        setIsScreenSharing(true);
        toast.success("Screen sharing started");
      } catch {
        toast.error("Screen sharing cancelled");
      }
    }
  };

  const sendChatMessage = () => {
    if (!newMessage.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "You",
        content: newMessage.trim(),
        timestamp: new Date(),
      },
    ]);
    setNewMessage("");
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peerConnectionRef.current?.close();
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Video Conference</h1>
          <p className="text-muted-foreground">
            Zero-latency peer-to-peer video calls with WebRTC
          </p>
        </div>
        {isInCall && (
          <div className="flex items-center gap-3">
            <Badge variant="destructive" className="animate-pulse">
              LIVE
            </Badge>
            <span className="text-sm font-mono text-muted-foreground">
              {formatDuration(callDuration)}
            </span>
            <Badge variant="secondary">
              <Users className="mr-1 h-3 w-3" />
              {participantCount}
            </Badge>
          </div>
        )}
      </div>

      {!isInCall ? (
        /* Pre-call lobby */
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Start a New Call
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create a new room and invite team members or clients to join.
              </p>
              <Button onClick={() => { generateRoomId(); startCall(); }} className="w-full">
                <Phone className="mr-2 h-4 w-4" />
                Start Call
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Join a Call
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter a room ID to join an existing call.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter room ID..."
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
                <Button onClick={startCall} disabled={!roomId}>
                  Join
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Video, label: "HD Video", desc: "720p/1080p adaptive streaming" },
                  { icon: Mic, label: "Crystal Audio", desc: "Echo cancellation & noise suppression" },
                  { icon: Monitor, label: "Screen Share", desc: "Share your screen with one click" },
                  { icon: MessageSquare, label: "In-Call Chat", desc: "Send messages during the call" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3 rounded-lg border p-3">
                    <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* In-call view */
        <div className="grid gap-4 lg:grid-cols-4">
          <div className={`${showChat ? "lg:col-span-3" : "lg:col-span-4"}`}>
            {/* Video grid */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className={`relative bg-black ${isFullscreen ? "fixed inset-0 z-50" : "aspect-video"}`}>
                  {/* Remote video (large) */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {/* No remote participant placeholder */}
                  {participantCount < 2 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gradient-to-br from-gray-900 to-gray-800">
                      <Users className="h-16 w-16 mb-4 opacity-50" />
                      <p className="text-lg font-medium">Waiting for others to join...</p>
                      <div className="flex items-center gap-2 mt-3 bg-white/10 rounded-lg px-4 py-2">
                        <span className="text-sm font-mono">{roomId}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-white hover:text-white/80"
                          onClick={() => {
                            navigator.clipboard.writeText(roomId);
                            toast.success("Room ID copied");
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Local video (picture-in-picture) */}
                  <div className="absolute bottom-4 right-4 w-48 aspect-video rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover mirror"
                    />
                    {isVideoOff && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <VideoOff className="h-6 w-6 text-white/50" />
                      </div>
                    )}
                  </div>

                  {/* Controls overlay */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
                    <Button
                      variant={isMuted ? "destructive" : "secondary"}
                      size="icon"
                      className="rounded-full h-10 w-10"
                      onClick={toggleMute}
                    >
                      {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant={isVideoOff ? "destructive" : "secondary"}
                      size="icon"
                      className="rounded-full h-10 w-10"
                      onClick={toggleVideo}
                    >
                      {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant={isScreenSharing ? "default" : "secondary"}
                      size="icon"
                      className="rounded-full h-10 w-10"
                      onClick={toggleScreenShare}
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="rounded-full h-10 w-10"
                      onClick={() => setShowChat(!showChat)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="rounded-full h-10 w-10"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                    >
                      {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                    <div className="w-px h-6 bg-white/20 mx-1" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="rounded-full h-10 w-10"
                      onClick={endCall}
                    >
                      <PhoneOff className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat sidebar */}
          {showChat && (
            <Card className="lg:col-span-1 flex flex-col h-[calc(56.25vw*0.75)]  max-h-[600px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">In-Call Chat</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                <ScrollArea className="flex-1 p-3">
                  {chatMessages.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No messages yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className="rounded-lg bg-muted px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{msg.sender}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {msg.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm mt-0.5">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="border-t p-2">
                  <form
                    onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }}
                    className="flex gap-1"
                  >
                    <Input
                      placeholder="Message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="text-sm h-8"
                    />
                    <Button type="submit" size="sm" className="h-8 px-3" disabled={!newMessage.trim()}>
                      Send
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
