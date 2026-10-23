class Courses:
    def __init__(self, store, clock):
        self.store,self.clock=store,clock

    def create(self, user, data):
        return self.store.create_course(user["id"],data,self.clock())

    def list(self, user):
        return self.store.courses(user["id"])

    def get(self, user, cid):
        return self.store.course(user["id"],cid)
