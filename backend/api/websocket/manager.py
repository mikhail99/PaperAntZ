"""
WebSocket manager for real-time updates
"""

import json
import asyncio
from typing import Dict, Set, Any
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        # Store active connections
        self.active_connections: Dict[str, Set[Any]] = {}  # topic -> connections
        
        # Store connection metadata
        self.connection_info: Dict[Any, Dict[str, Any]] = {}
    
    async def connect(self, websocket, topic: str):
        """Accept a WebSocket connection and add to topic"""
        await websocket.accept()
        
        if topic not in self.active_connections:
            self.active_connections[topic] = set()
        
        self.active_connections[topic].add(websocket)
        
        # Store connection info
        self.connection_info[websocket] = {
            "topic": topic,
            "connected_at": datetime.now(),
            "client_ip": getattr(websocket, 'client', {}).get('host', 'unknown')
        }
        
        logger.info(f"WebSocket connected to topic '{topic}'. Total connections: {len(self.connection_info)}")
        
        # Send welcome message
        await self.send_personal_message({
            "type": "connection_established",
            "topic": topic,
            "message": "Connected to real-time updates",
            "timestamp": datetime.now().isoformat()
        }, websocket)
    
    def disconnect(self, websocket, topic: str):
        """Remove WebSocket connection from topic"""
        if topic in self.active_connections:
            self.active_connections[topic].discard(websocket)
            if not self.active_connections[topic]:
                del self.active_connections[topic]
        
        # Remove connection info
        if websocket in self.connection_info:
            del self.connection_info[websocket]
        
        logger.info(f"WebSocket disconnected from topic '{topic}'. Remaining connections: {len(self.connection_info)}")
    
    async def send_personal_message(self, message: Dict[str, Any], websocket):
        """Send message to specific WebSocket"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            # Remove disconnected websocket
            self.cleanup_connection(websocket)
    
    async def broadcast_to_topic(self, message: Dict[str, Any], topic: str):
        """Broadcast message to all connections in a topic"""
        if topic not in self.active_connections:
            return
        
        disconnected = set()
        
        for connection in self.active_connections[topic]:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting to topic '{topic}': {e}")
                disconnected.add(connection)
        
        # Clean up disconnected connections
        for connection in disconnected:
            self.cleanup_connection(connection)
    
    async def send_execution_update(self, execution_id: str, status: str, progress: float = None, message: str = None):
        """Send execution update to all subscribers"""
        update_message = {
            "type": "execution_update",
            "execution_id": execution_id,
            "status": status,
            "progress": progress,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        
        topic = f"executions/{execution_id}"
        await self.broadcast_to_topic(update_message, topic)
    
    async def send_workflow_update(self, workflow_id: str, agent_id: str = None, execution_id: str = None, status: str = None, result: Dict[str, Any] = None):
        """Send workflow update to all subscribers"""
        update_message = {
            "type": "workflow_update",
            "workflow_id": workflow_id,
            "agent_id": agent_id,
            "execution_id": execution_id,
            "status": status,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
        
        topic = f"workflows/{workflow_id}"
        await self.broadcast_to_topic(update_message, topic)
    
    async def send_optimization_update(self, optimization_id: str, status: str, progress: float = None, generation: int = None, best_score: float = None):
        """Send optimization update to all subscribers"""
        update_message = {
            "type": "optimization_update",
            "optimization_id": optimization_id,
            "status": status,
            "progress": progress,
            "generation": generation,
            "best_score": best_score,
            "timestamp": datetime.now().isoformat()
        }
        
        topic = f"optimizations/{optimization_id}"
        await self.broadcast_to_topic(update_message, topic)
    
    async def send_system_notification(self, message: str, level: str = "info"):
        """Send system notification to all connections"""
        notification = {
            "type": "system_notification",
            "level": level,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        
        # Broadcast to system topic
        await self.broadcast_to_topic(notification, "system")
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get connection statistics"""
        topic_stats = {}
        for topic, connections in self.active_connections.items():
            topic_stats[topic] = len(connections)
        
        return {
            "total_connections": len(self.connection_info),
            "topics": topic_stats,
            "active_topics": len(self.active_connections)
        }
    
    def cleanup_connection(self, websocket):
        """Clean up a disconnected connection"""
        # Find and remove from all topics
        for topic, connections in self.active_connections.items():
            if websocket in connections:
                connections.discard(websocket)
        
        # Remove from connection info
        if websocket in self.connection_info:
            topic = self.connection_info[websocket].get("topic", "unknown")
            del self.connection_info[websocket]
            logger.info(f"Cleaned up connection from topic '{topic}'")
    
    async def cleanup_inactive_connections(self, max_age_hours: int = 1):
        """Clean up inactive connections"""
        cutoff_time = datetime.now().timestamp() - (max_age_hours * 3600)
        
        inactive_connections = []
        for websocket, info in self.connection_info.items():
            if info["connected_at"].timestamp() < cutoff_time:
                inactive_connections.append(websocket)
        
        for websocket in inactive_connections:
            self.cleanup_connection(websocket)
        
        if inactive_connections:
            logger.info(f"Cleaned up {len(inactive_connections)} inactive connections")
        
        return len(inactive_connections)

# Global connection manager instance
manager = ConnectionManager()

# Simulated real-time update generators
class UpdateSimulator:
    """Simulates real-time updates for demonstrations"""
    
    def __init__(self, connection_manager: ConnectionManager):
        self.connection_manager = connection_manager
        self.simulation_tasks = {}
    
    async def start_execution_simulation(self, execution_id: str, duration: int = 10):
        """Start simulating execution updates"""
        if execution_id in self.simulation_tasks:
            return
        
        task = asyncio.create_task(self._simulate_execution_updates(execution_id, duration))
        self.simulation_tasks[execution_id] = task
    
    async def _simulate_execution_updates(self, execution_id: str, duration: int):
        """Simulate execution progress updates"""
        try:
            steps = [
                ("initializing", "Initializing execution environment..."),
                ("processing", "Processing request..."),
                ("analyzing", "Analyzing data..."),
                ("generating", "Generating response..."),
                ("finalizing", "Finalizing results..."),
                ("completed", "Execution completed successfully")
            ]
            
            for i, (status, message) in enumerate(steps):
                progress = (i + 1) / len(steps)
                
                await self.connection_manager.send_execution_update(
                    execution_id=execution_id,
                    status=status,
                    progress=progress,
                    message=message
                )
                
                if i < len(steps) - 1:
                    await asyncio.sleep(duration / len(steps))
            
        except asyncio.CancelledError:
            logger.info(f"Execution simulation {execution_id} cancelled")
        except Exception as e:
            logger.error(f"Error in execution simulation {execution_id}: {e}")
        finally:
            if execution_id in self.simulation_tasks:
                del self.simulation_tasks[execution_id]
    
    async def start_workflow_simulation(self, workflow_id: str, steps: list):
        """Start simulating workflow updates"""
        if workflow_id in self.simulation_tasks:
            return
        
        task = asyncio.create_task(self._simulate_workflow_updates(workflow_id, steps))
        self.simulation_tasks[workflow_id] = task
    
    async def _simulate_workflow_updates(self, workflow_id: str, steps: list):
        """Simulate workflow progress updates"""
        try:
            for i, (agent_id, task) in enumerate(steps):
                execution_id = f"exec_{workflow_id}_{i}"
                
                # Start step
                await self.connection_manager.send_workflow_update(
                    workflow_id=workflow_id,
                    agent_id=agent_id,
                    execution_id=execution_id,
                    status="started",
                    result={"task": task}
                )
                
                # Simulate step execution
                await asyncio.sleep(2)
                
                # Complete step
                await self.connection_manager.send_workflow_update(
                    workflow_id=workflow_id,
                    agent_id=agent_id,
                    execution_id=execution_id,
                    status="completed",
                    result={"output": f"Completed {task}", "status": "success"}
                )
                
                if i < len(steps) - 1:
                    await asyncio.sleep(1)
            
            # Complete workflow
            await self.connection_manager.send_workflow_update(
                workflow_id=workflow_id,
                status="completed",
                result={"summary": "Workflow completed successfully"}
            )
            
        except asyncio.CancelledError:
            logger.info(f"Workflow simulation {workflow_id} cancelled")
        except Exception as e:
            logger.error(f"Error in workflow simulation {workflow_id}: {e}")
        finally:
            if workflow_id in self.simulation_tasks:
                del self.simulation_tasks[workflow_id]
    
    def stop_simulation(self, simulation_id: str):
        """Stop a simulation"""
        if simulation_id in self.simulation_tasks:
            self.simulation_tasks[simulation_id].cancel()
            del self.simulation_tasks[simulation_id]

# Global update simulator instance
update_simulator = UpdateSimulator(manager)