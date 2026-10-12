# Local install into every Raycast app present (Raycast and/or Raycast Beta). See README "Install".
# The extension lives in amphetamine/; every target runs there.

.PHONY: install uninstall restart-raycast

# install: install dependencies if needed, then build and register the extension with each Raycast app
install:
	@$(MAKE) -C amphetamine install

# uninstall: remove the build from every Raycast extensions folder and restart the running apps
uninstall:
	@$(MAKE) -C amphetamine uninstall

# restart-raycast: quit and reopen each running Raycast app so it re-indexes local extensions
restart-raycast:
	@$(MAKE) -C amphetamine restart-raycast
