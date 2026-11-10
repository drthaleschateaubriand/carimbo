#!/bin/bash
N=${1:-0}; cd /workspace/carimbar-mv-nuvem/testes
for i in $(seq 1 600); do c=$(grep -c '^EXT' ext.log 2>/dev/null); c=${c:-0}; [ "$c" -gt "$N" ] && break; sleep 1; done
grep '^EXT' ext.log | tail -1
