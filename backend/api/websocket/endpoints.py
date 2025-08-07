"""
WebSocket endpoints for real-time updates
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from typing import Dict, Any
import json
import logging

from api.websocket.manager import manager, update_simulator

logger = logging.getLogger(__name__)
router = APIRouter()

@router.websocket("/ws/executions/{execution_id}")
async def websocket_executions(websocket: WebSocket, execution_id: str):
    """WebSocket endpoint for execution updates"""
    topic = f"executions/{execution_id}"
    
    try:
        await manager.connect(websocket, topic)
        
        # Start simulation for demonstration
        await update_simulator.start_execution_simulation(execution_id, duration=15)
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages (keep connection alive)
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle client messages
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": message.get("timestamp")
                    }))
                elif message.get("type") == "get_status":
                    # Send current status
                    await websocket.send_text(json.dumps({
                        "type": "status",
                        "execution_id": execution_id,
                        "status": "running",
                        "message": "Execution in progress"
                    }))
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON format"
                }))
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Internal server error"
                }))
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for execution {execution_id}")
    except Exception as e:
        logger.error(f"WebSocket error for execution {execution_id}: {e}")
    finally:
        manager.disconnect(websocket, topic)
        update_simulator.stop_simulation(execution_id)

@router.websocket("/ws/workflows/{workflow_id}")
async def websocket_workflows(websocket: WebSocket, workflow_id: str):
    """WebSocket endpoint for workflow updates"""
    topic = f"workflows/{workflow_id}"
    
    try:
        await manager.connect(websocket, topic)
        
        # Define workflow steps for simulation
        workflow_steps = [
            ("planning-agent", "Create research plan"),
            ("research-agent", "Conduct research"),
            ("writing-agent", "Generate report"),
            ("review-agent", "Review and finalize")
        ]
        
        # Start simulation for demonstration
        await update_simulator.start_workflow_simulation(workflow_id, workflow_steps)
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle client messages
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": message.get("timestamp")
                    }))
                elif message.get("type") == "get_status":
                    # Send current status
                    await websocket.send_text(json.dumps({
                        "type": "status",
                        "workflow_id": workflow_id,
                        "status": "running",
                        "message": "Workflow in progress"
                    }))
                elif message.get("type") == "pause_workflow":
                    # Pause workflow simulation
                    update_simulator.stop_simulation(workflow_id)
                    await websocket.send_text(json.dumps({
                        "type": "workflow_paused",
                        "workflow_id": workflow_id
                    }))
                elif message.get("type") == "resume_workflow":
                    # Resume workflow simulation
                    await update_simulator.start_workflow_simulation(workflow_id, workflow_steps)
                    await websocket.send_text(json.dumps({
                        "type": "workflow_resumed",
                        "workflow_id": workflow_id
                    }))
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON format"
                }))
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Internal server error"
                }))
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for workflow {workflow_id}")
    except Exception as e:
        logger.error(f"WebSocket error for workflow {workflow_id}: {e}")
    finally:
        manager.disconnect(websocket, topic)
        update_simulator.stop_simulation(workflow_id)

@router.websocket("/ws/optimizations/{optimization_id}")
async def websocket_optimizations(websocket: WebSocket, optimization_id: str):
    """WebSocket endpoint for optimization updates"""
    topic = f"optimizations/{optimization_id}"
    
    try:
        await manager.connect(websocket, topic)
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle client messages
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": message.get("timestamp")
                    }))
                elif message.get("type") == "get_status":
                    # Send current status
                    await websocket.send_text(json.dumps({
                        "type": "status",
                        "optimization_id": optimization_id,
                        "status": "running",
                        "message": "Optimization in progress"
                    }))
                elif message.get("type") == "request_update":
                    # Send optimization progress update
                    await websocket.send_text(json.dumps({
                        "type": "optimization_update",
                        "optimization_id": optimization_id,
                        "status": "running",
                        "progress": 0.5,
                        "generation": 3,
                        "best_score": 0.85,
                        "message": "Optimization progressing normally"
                    }))
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON format"
                }))
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Internal server error"
                }))
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for optimization {optimization_id}")
    except Exception as e:
        logger.error(f"WebSocket error for optimization {optimization_id}: {e}")
    finally:
        manager.disconnect(websocket, topic)

@router.websocket("/ws/system")
async def websocket_system(websocket: WebSocket):
    """WebSocket endpoint for system notifications"""
    topic = "system"
    
    try:
        await manager.connect(websocket, topic)
        
        # Send initial system status
        await websocket.send_text(json.dumps({
            "type": "system_status",
            "message": "Connected to system notifications",
            "stats": manager.get_connection_stats(),
            "timestamp": manager.connection_info[websocket]["connected_at"].isoformat()
        }))
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle client messages
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": message.get("timestamp")
                    }))
                elif message.get("type") == "get_stats":
                    # Send connection statistics
                    await websocket.send_text(json.dumps({
                        "type": "connection_stats",
                        "stats": manager.get_connection_stats()
                    }))
                elif message.get("type") == "subscribe":
                    # Subscribe to additional topics
                    additional_topic = message.get("topic")
                    if additional_topic:
                        await manager.send_personal_message({
                            "type": "subscription_confirmed",
                            "topic": additional_topic,
                            "message": f"Subscribed to {additional_topic}"
                        }, websocket)
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON format"
                }))
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Internal server error"
                }))
                
    except WebSocketDisconnect:
        logger.info("System WebSocket disconnected")
    except Exception as e:
        logger.error(f"System WebSocket error: {e}")
    finally:
        manager.disconnect(websocket, topic)

@router.get("/websocket/stats")
async def get_websocket_stats():
    """Get WebSocket connection statistics"""
    try:
        stats = manager.get_connection_stats()
        
        return {
            "success": True,
            "message": "WebSocket statistics retrieved successfully",
            "data": stats
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get WebSocket stats: {str(e)}"
        )

@router.post("/websocket/cleanup")
async def cleanup_websocket_connections(
    background_tasks: BackgroundTasks,
    max_age_hours: int = 1
):
    """Clean up inactive WebSocket connections"""
    try:
        # Run cleanup in background
        background_tasks.add_task(
            manager.cleanup_inactive_connections,
            max_age_hours
        )
        
        return {
            "success": True,
            "message": f"WebSocket cleanup initiated for connections older than {max_age_hours} hours",
            "data": {"max_age_hours": max_age_hours}
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate WebSocket cleanup: {str(e)}"
        )

@router.post("/websocket/broadcast")
async def broadcast_system_notification(
    message: str,
    level: str = "info"
):
    """Broadcast a system notification to all connected clients"""
    try:
        await manager.send_system_notification(message, level)
        
        return {
            "success": True,
            "message": "System notification broadcast successfully",
            "data": {"message": message, "level": level}
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to broadcast system notification: {str(e)}"
        )