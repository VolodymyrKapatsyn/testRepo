LOGFILE=$(shell date +forever_log_%Y-%m-%d_%H-%M-%S.txt)

.PHONY: stop
stop:
	killall -r node

.PHONY: start
start:
	forever start -l "/nodejs/node_logs/forever_log.txt" -a -c "node --nouse-idle-notification" /nodejs/node_server/server.js

.PHONY: rename_logs
rename_logs:
	 mv /nodejs/node_logs/forever_log.txt /nodejs/node_logs/${LOGFILE}

.PHONY: restart
restart:
	killall -r node && sleep 1  && mv /nodejs/node_logs/forever_log.txt /nodejs/node_logs/${LOGFILE} && forever start -l "/nodejs/node_logs/forever_log.txt" -a -c "node --nouse-idle-notification --max_old_space_size=2200" /nodejs/node_server/server.js

.DEFAULT_GOAL = restart
