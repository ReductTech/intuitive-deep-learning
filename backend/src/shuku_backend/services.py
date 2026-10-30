class Courses:
    def __init__(self, store, clock, github=None):
        self.store,self.clock,self.github=store,clock,github

    def create(self, user, data):
        return self.store.create_course(user["id"],data,self.clock(),self.github)

    def list(self, user):
        return self.store.courses(user["id"])

    def get(self, user, cid):
        return self.store.course(user["id"],cid)
